---
title: '我花了一周，把一台机器人"造"进了电脑里'
description: '从"在 ROS2 里，一台机器人首先是一堆 XML"讲起，把 URDF 建模、Xacro 复用、Gazebo 加载、ros2_control 控制、launch 编排串成完整链路，并对比另一台只有 1 个 link、0 个关节的无人机模型。'
publishDate: 2026-10-12T12:00:00+08:00
tags:
  - 建模
  - 仿真
---

# 我花了一周，把一台机器人"造"进了电脑里

> ROS2 学习笔记 · 建模与仿真的完整链路
> 2026-10-12

---

## 引子

学 ROS2 到第三周，我终于碰到最"硬核"也最爽的部分：**建模与仿真**。

在此之前，我对机器人的理解停留在——"哦，它有个轮子会转"。

一周之后我明白了一件事：**在 ROS2 里，一台机器人首先是一堆 XML。**

听起来有点扫兴对吧？但当你意识到，你可以用几十行文本描述一台机器人长什么样、有多重、轮子转多快、摄像头看到什么——然后用一条命令把它扔进一个虚拟世界跑起来——那种感觉还挺奇妙的。

这篇博客，我想把这周踩过的坑和摸清的脉络，完整地讲一遍。

---

## 一、为什么机器人需要"模型"？

先说个最朴素的问题：**为什么要建模？**

因为你不可能为了调试一段代码，天天去买一台真机器人。

而且真机器人很贵，摔了要花钱，电机烧了要等货。

所以我需要一个**数字替身**：它长得和真机一样、物理特性和真机一样，但只活在电脑里。我可以在里面随便撞、随便翻车，成本为零。

这个数字替身，在 ROS2 里就是 **URDF 模型**。

---

## 二、第一层：URDF —— 用 XML 描述机器人

URDF 全称 **Unified Robot Description Format**，统一机器人描述格式。

别被名字吓到，它本质上就是个 XML 文件，回答两个问题：

1. **这个机器人由哪些零件组成？** → `<link>`
2. **这些零件怎么连起来？** → `<joint>`

### link：一个"刚体"

每个 `<link>` 代表一个不可形变的零件。它可以是一段机身、一个轮子、一个雷达。

关键是：**每个 link 要描述三件事。**

```xml
<link name="base_link">
  <!-- ① 看起来是什么样（画图用） -->
  <visual>
    <geometry><box size="0.3 0.3 0.1"/></geometry>
    <material name="blue"/>
  </visual>

  <!-- ② 碰撞起来是什么形状（物理用） -->
  <collision>
    <geometry><box size="0.3 0.3 0.1"/></geometry>
  </collision>

  <!-- ③ 有多重、质量怎么分布（物理用） -->
  <inertial>
    <mass value="2.0"/>
    <inertia ixx="..." iyy="..." izz="..."/>
  </inertial>
</link>
```

**这三件套，是我这周踩的最大的坑。**

我一开始觉得：`visual` 和 `collision` 长得一样，复制一份不就行了？`inertial` 随便填个数不就行了？

**都不行。**

- `collision` 用简单的几何体（盒子、圆柱、球）算碰撞，比 `visual` 的精细形状快得多。所以**碰撞体通常要比视觉体简化**。一个复杂的雷达外形，碰撞体往往就是一个圆柱。
- `inertial` 更要命：**质量填 0，Gazebo 里的物体会直接飞上天**（物理引擎除零）；惯性矩阵填错，物体会诡异抖动甚至穿模。

我当时的解决办法是用 Xacro 提供的现成宏来算：

```xml
<!-- 长方体的惯性矩阵，有公式可套，不用手推 -->
<xacro:macro name="box_inertia" params="m w h d">
  <inertial>
    <mass value="${m}"/>
    <inertia ixx="${m*(h*h+d*d)/12}" iyy="${m*(w*w+d*d)/12}" izz="${m*(w*w+h*h)/12}"/>
  </inertial>
</xacro:macro>
```

这正好引出了下一层。

---

### joint：把零件连起来

`<link>` 描述零件，`<joint>` 描述**零件之间怎么动**。

```xml
<joint name="left_wheel_joint" type="continuous">
  <parent link="base_link"/>
  <child link="left_wheel"/>
  <origin xyz="0.1 0.15 0.02" rpy="0 0 0"/>
  <axis xyz="0 1 0"/>
</joint>
```

两个关键属性：

- **`type`**：决定"怎么动"
  - `fixed` —— 焊死的，不动（比如底盘上贴的 IMU）
  - `continuous` —— 能无限转（轮子就是这种）
  - `revolute` —— 能转，但有角度上下限
  - `prismatic` —— 直线滑轨
- **`origin`**：这个零件相对父零件，装在**哪个位置、什么朝向**

**我卡了很久的一个点**：`origin` 的坐标是**相对父 link**的，不是相对世界的。

所以改一个 link 的位置，可能连带影响下面挂的一串子 link —— 因为它们是"父子链"关系。

这也解释了为什么 ROS2 里的 TF 坐标树能自动算出来：**只要 URDF 里的父子关系定了，每个零件的世界坐标就是一路乘下来的。** 你不需要手动算任何绝对坐标。

---

## 三、第二层：Xacro —— 别复制粘贴

写到这里问题来了：如果我有两个一样的轮子、四个一样的雷达支架，难道要复制粘贴四遍？

**不行，改一处要改四遍，迟早出错。**

于是有了 **Xacro**（XML Macro）。它在 URDF 之上加了三样东西：

**① 宏：把重复结构打包**

```xml
<xacro:macro name="wheel" params="prefix x_offset">
  <link name="${prefix}_wheel">...</link>
  <joint name="${prefix}_wheel_joint">
    <origin xyz="${x_offset} 0.15 0.02"/>
  </joint>
</xacro:macro>

<!-- 用的时候，两行搞定两个轮子 -->
<xacro:wheel prefix="left"  x_offset="0.1"/>
<xacro:wheel prefix="right" x_offset="0.1"/>
```

**② 变量：抽掉魔法数字**

```xml
<xacro:property name="wheel_radius" value="0.033"/>
<cylinder radius="${wheel_radius}" length="0.02"/>
```

以后想改轮子粗细，只改这一行。

**③ include：拆文件**

我可以把相机、雷达、IMU 各自的描述拆成独立文件，最后用一个"总装文件"拼起来：

```xml
<xacro:include filename="sensor/camera.urdf.xacro"/>
<xacro:include filename="sensor/laser.urdf.xacro"/>
```

**这个"拆文件 + 总装"的结构，是我这周收获最大的习惯。**

我现在做任何模型都这么组织：

```
fishbot.urdf.xacro          ← 总装文件，只放 include 和最后的拼装
base.urdf.xacro             ← 底盘本体
common_inertia.xacro        ← 惯性宏（工具箱，谁都能调）
sensor/camera.urdf.xacro    ← 相机
sensor/laser.urdf.xacro     ← 激光雷达
sensor/imu.urdf.xacro       ← IMU
actuator/wheel.urdf.xacro   ← 驱动轮
actuator/caster.urdf.xacro  ← 万向轮
```

**好处**：以后加一个传感器，就是加一个文件 + 一行 include，完全不碰其他文件。这才是能长大的写法。

---

## 四、第三层：Gazebo —— 让模型"活"起来

到这里，我有了一个模型文件。但它只是一个**静态描述**——像一张图纸。

要让图纸"活"起来，需要 **Gazebo**：一个三维物理仿真环境。

Gazebo 负责三件事：

1. **重力**：东西会往下掉
2. **碰撞**：东西撞在一起会弹开
3. **摩擦**：轮子会打滑、地面有阻力

启动方式很简单，在 launch 里把模型"生成"进去：

```python
Node(package="gazebo_ros", executable="spawn_entity.py",
     arguments=["-topic", "robot_description", "-entity", "fishbot"])
```

**这行代码做的事**：从 `robot_description` 这个话题里读 URDF，然后在 Gazebo 里生成一个叫 `fishbot` 的实体。

⚠️ **踩坑提示**：`robot_description` 是一个**话题**，不是文件。URDF 文件的内容要先被读进来、由 `robot_state_publisher` 节点处理成字符串，再发到这个话题上。

**中间这层"转换"如果断了，Gazebo 里就是空的**——模型生不出来。

---

## 五、第四层：ros2_control —— 让模型"听命令"

模型会动了，但还不会听我的话。

我想让它"往前走"，怎么做？

**这就是 ros2_control 要解决的。**

它把"发命令"和"驱动硬件"彻底解耦：

```
我发 /cmd_vel ──→ 控制器 ──→ 硬件接口 ──→ 电机转
   (想要什么)      (怎么算)     (怎么送)
```

四个角色：

| 角色 | 干什么 |
|---|---|
| **controller_manager** | 总管，负责加载、启动、切换控制器 |
| **controller** | 具体算法。比如"两轮差速控制器"把 `/cmd_vel` 算成左右轮各转多快 |
| **joint_state_broadcaster** | 把轮子当前角度发出来（不发，RViz 里轮子就不会转） |
| **hardware interface** | 真正和硬件对话的层。仿真里对接 Gazebo，真机里对接电机驱动板 |

配置写在 yaml 里：

```yaml
controller_manager:
  ros__parameters:
    update_rate: 10          # 控制器每秒跑几轮
    diff_drive_controller:
      type: diff_drive_controller/DiffDriveController

diff_drive_controller:
  ros__parameters:
    left_wheel_names:  ["left_wheel_joint"]
    right_wheel_names: ["right_wheel_joint"]
    wheel_separation: 0.30
    wheel_radius: 0.033
```

**关键认识**：yaml 里的 `left_wheel_names` 必须和 URDF 里的 `<joint name="...">` **完全一致**——这是两个文件之间唯一的"合同"。写错一个字，控制器就找不到轮子，启动时报错。

---

## 六、第五层：launch —— 一条命令启动全部

问题来了：上面这些东西（Gazebo、模型、控制器、RViz）——难道要开五个终端分别启动？

**用 launch 文件，一条命令搞定。**

```python
def generate_launch_description():
    return LaunchDescription([
        # ① 解析 xacro → 发布模型描述到 robot_description
        Node(package="robot_state_publisher", ...),
        # ② 启动 Gazebo 世界
        IncludeLaunchDescription(...),
        # ③ 把模型生成到 Gazebo 里
        Node(package="gazebo_ros", executable="spawn_entity.py", ...),
        # ④ 加载控制器（必须等 Gazebo 起来之后！）
        TimerAction(period=3.0, actions=[...]),
    ])
```

**launch / xacro / yaml 三者的关系，我这周终于理清了：**

```
launch  ──启动──→  xacro  ──生成──→  URDF  ──发布──→  Gazebo
   │
   └─────读取────→  yaml   ──参数──→  controller_manager
```

- **xacro** 是"图纸生成器"
- **yaml** 是"参数表"
- **launch** 是"总指挥"，负责按顺序把大家叫起来

**⚠️ 这里最容易踩的坑是时序**：控制器必须在 Gazebo 把模型加载完之后才能加载，否则会报"找不到 joint"。所以要用 `TimerAction` 延迟几秒。

我第一遍就是没加延迟，log 里刷了一屏红色报错，找了半小时才反应过来——**不是配置错了，是启动太快了。**

---

## 七、传感器：机器人的"眼睛"

模型能跑能转了，最后一步：**让它感知世界**。

在仿真里加传感器，要写两段东西：

**① 在 URDF 里声明传感器**

```xml
<gazebo reference="camera_link">
  <sensor type="camera" name="camera">
    <update_rate>10</update_rate>
    <camera>
      <horizontal_fov>1.047</horizontal_fov>
      <image><width>640</width><height>480</height></image>
    </camera>
  </sensor>
</gazebo>
```

**② 用插件把它接到 ROS2**

```xml
<plugin name="camera_controller" filename="libgazebo_ros_camera.so">
  <ros><remapping>image_raw:=/camera/image_raw</remapping></ros>
</plugin>
```

**为什么要两段？** 因为 `<sensor>` 只告诉 Gazebo"有个摄像头在这儿"，**插件**才负责把数据转成 ROS2 话题发出去。

**这一步做完，我在终端敲 `ros2 topic list`，就能看到 `/camera/image_raw` 了——仿真里的摄像头，成了我程序里的一个话题。**

这周我一共加了三种传感器：

- **相机**（深度相机）—— 给视觉识别用
- **激光雷达** —— 给建图和避障用
- **IMU** —— 给姿态估计用

三种都是同一个套路：**声明 + 插件**。

---

## 八、串起来看：完整的数据流

```
URDF/Xacro  ──描述──→  机器人长什么样
    │
    ↓
Gazebo  ──物理引擎──→  它怎么动、怎么撞
    │
    ├── 传感器插件 ──→  /camera  /scan  /imu   （感知：世界→我）
    │
    └── ros2_control ──→  /cmd_vel              （控制：我→世界）
    │
    ↓
RViz  ──可视化──→  我看到它
```

**这一整条链，就是"仿真"。**

---

## 九、一个有意思的对照

这周我正好看到一份**别人写的无人机仿真模型**，和我在学的完全不一样。对比一下特别有启发：

|  | 我学的（地面机器人） | 那台无人机 |
|---|---|---|
| 模型格式 | URDF + Xacro | **SDF**（直接写在 world 里） |
| link 数量 | 10 个 | **1 个** |
| 关节数量 | 9 个 | **0 个** |
| 控制方式 | **ros2_control** | **自定义插件** |

**为什么差这么多？**

- 无人机是**刚体**——它不靠"转关节"飞，靠直接改位姿。所以根本不需要 joint。
- 没有关节，ros2_control 那套"关节控制器"就派不上用场，只能用自定义插件直接接管物理更新。

**这让我意识到一件事**：ros2_control 不是"必须用的标准"，它只是**为多关节机器人设计的一套方案**。换个问题（比如飞行器），就有别的方案。

**工具是跟着问题走的，不是反过来。**

---

## 十、这周遗留的问题

老实说，这周我是"跟教程能跑通，换个场景大概写不出来"。

具体卡在哪：

1. **惯性参数** —— 知道要填，但不清楚具体数值背后的物理意义
2. **插件机制** —— 只会抄现成插件，不懂它内部怎么和 Gazebo 通信
3. **ros2_control 底层** —— 只知道流程走向，不清楚 `update_rate`、硬件接口这些细节

**所以下周计划**：回头把 **Xacro 宏 / link-joint / 惯性参数**这三点吃透，再继续往下走导航。

---

## 写在最后

如果用一句话总结这周的收获：

> **在 ROS2 里，机器人 = 描述（URDF） + 物理（Gazebo） + 控制（ros2_control） + 编排（launch）。**

这四块每一块单独看都不算难，难的是**它们怎么咬合在一起**。

而一旦咬合成功——你在终端敲下一行速度指令，屏幕上那台由几十行 XML 描述的机器人开始往前开——**那种感觉，值得。**

---

*本文是我 ROS2 学习系列的笔记之一，记录真实踩坑与理解过程，不做教程搬运。*
