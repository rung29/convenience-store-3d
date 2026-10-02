"""Build a Taiwanese convenience-store oden counter from the CC0 base GLB.

Run with Blender in background mode:

blender --background --python scripts/blender/build_taiwan_oden_counter.py -- \
  --input scripts/blender/source/oden-hot-food-counter-source.glb \
  --output public/models/store/oden-hot-food-counter.glb \
  --blend scripts/blender/oden-hot-food-counter.blend \
  --preview scripts/blender/previews/oden-hot-food-counter.png
"""

from __future__ import annotations

import argparse
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--blend", required=True)
    parser.add_argument("--preview", required=True)
    return parser.parse_args(argv)


def rgba(hex_color: str, alpha: float = 1.0) -> tuple[float, float, float, float]:
    value = hex_color.lstrip("#")
    return tuple(int(value[index : index + 2], 16) / 255 for index in (0, 2, 4)) + (alpha,)


def material(
    name: str,
    color: str,
    *,
    metallic: float = 0.0,
    roughness: float = 0.45,
    alpha: float = 1.0,
    emission: str | None = None,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = rgba(color, alpha)
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = rgba(color, alpha)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Alpha"].default_value = alpha
    if emission:
        shader.inputs["Emission Color"].default_value = rgba(emission)
        shader.inputs["Emission Strength"].default_value = emission_strength
    if alpha < 1:
        try:
            mat.surface_render_method = "DITHERED"
        except AttributeError:
            pass
    return mat


def activate(obj: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)


def assign(obj: bpy.types.Object, mat: bpy.types.Material) -> bpy.types.Object:
    obj.data.materials.append(mat)
    return obj


def box(
    name: str,
    dimensions: tuple[float, float, float],
    location: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    bevel: float = 0.012,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(obj, mat)
    if bevel:
        modifier = obj.modifiers.new("Soft manufactured edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    return obj


def cylinder(
    name: str,
    radius: float,
    depth: float,
    location: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    vertices: int = 24,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    assign(obj, mat)
    bevel = obj.modifiers.new("Rounded rim", "BEVEL")
    bevel.width = min(radius * 0.12, 0.008)
    bevel.segments = 2
    return obj


def sphere(
    name: str,
    radius: float,
    location: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    scale: tuple[float, float, float] = (1.0, 1.0, 1.0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=radius, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    assign(obj, mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def rod(
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    radius: float,
    mat: bpy.types.Material,
) -> bpy.types.Object:
    start_vec = Vector(start)
    end_vec = Vector(end)
    direction = end_vec - start_vec
    midpoint = (start_vec + end_vec) * 0.5
    obj = cylinder(name, radius, direction.length, midpoint, mat, vertices=12)
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    return obj


def steam_curve(
    name: str,
    points: list[tuple[float, float, float]],
    mat: bpy.types.Material,
) -> bpy.types.Object:
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 2
    curve.bevel_depth = 0.006
    curve.bevel_resolution = 2
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    assign(obj, mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    return obj


def add_vertical_label(font_path: str | None, sign_mat: bpy.types.Material, text_mat: bpy.types.Material) -> None:
    box("Oden_Sign_Plate", (0.46, 0.025, 0.18), (0.0, -0.365, 0.62), sign_mat, bevel=0.025)

    font_curve = bpy.data.curves.new("Oden_TraditionalChinese_Label", "FONT")
    font_curve.body = "關東煮"
    font_curve.align_x = "CENTER"
    font_curve.align_y = "CENTER"
    font_curve.size = 0.105
    font_curve.extrude = 0.003
    font_curve.bevel_depth = 0.001
    if font_path and os.path.exists(font_path):
        font_curve.font = bpy.data.fonts.load(font_path)
    text = bpy.data.objects.new("Oden_Label_Text_關東煮", font_curve)
    bpy.context.collection.objects.link(text)
    text.location = (0.0, -0.379, 0.62)
    text.rotation_euler = (math.radians(90), 0.0, 0.0)
    assign(text, text_mat)
    activate(text)
    bpy.ops.object.convert(target="MESH")


def build_food_compartment(
    index: int,
    x: float,
    y: float,
    metal: bpy.types.Material,
    broth: bpy.types.Material,
) -> None:
    box(f"Oden_Pan_{index:02d}", (0.275, 0.205, 0.05), (x, y, 1.015), metal, bevel=0.018)
    box(f"Oden_Broth_{index:02d}", (0.235, 0.165, 0.009), (x, y, 1.044), broth, bevel=0.012)


def add_ingredients(materials: dict[str, bpy.types.Material]) -> None:
    # White radish slices
    for index, (x, y) in enumerate([(-0.35, -0.13), (-0.29, -0.09), (-0.23, -0.14)]):
        cylinder(f"Daikon_{index:02d}", 0.038, 0.017, (x, y, 1.058), materials["daikon"], vertices=20)

    # Tea eggs
    for index, (x, y) in enumerate([(-0.06, -0.14), (0.02, -0.10)]):
        sphere(f"Tea_Egg_{index:02d}", 0.034, (x, y, 1.064), materials["egg"], scale=(1.0, 0.84, 0.82))

    # Fish balls
    for index, (x, y) in enumerate([(0.25, -0.14), (0.31, -0.09), (0.37, -0.14)]):
        sphere(f"Fish_Ball_{index:02d}", 0.031, (x, y, 1.066), materials["fish_ball"])

    # Tofu cubes
    for index, (x, y) in enumerate([(-0.35, 0.10), (-0.28, 0.15), (-0.22, 0.10)]):
        box(f"Fried_Tofu_{index:02d}", (0.052, 0.045, 0.034), (x, y, 1.064), materials["tofu"], bevel=0.008)

    # Konjac triangles
    for index, (x, y) in enumerate([(-0.05, 0.11), (0.03, 0.14)]):
        cylinder(f"Konjac_{index:02d}", 0.043, 0.022, (x, y, 1.06), materials["konjac"], vertices=3)

    # Chikuwa and fish cakes
    for index, (x, y) in enumerate([(0.25, 0.10), (0.31, 0.14), (0.37, 0.10)]):
        cylinder(
            f"Chikuwa_{index:02d}",
            0.026,
            0.07,
            (x, y, 1.075),
            materials["chikuwa"],
            rotation=(0.0, math.radians(68), math.radians(index * 18)),
            vertices=16,
        )

    # Bamboo skewers make the food immediately read as Taiwanese oden.
    skewer_points = [(-0.32, -0.12), (-0.01, -0.12), (0.31, -0.11), (-0.28, 0.12), (0.02, 0.12), (0.32, 0.12)]
    for index, (x, y) in enumerate(skewer_points):
        rod(
            f"Bamboo_Skewer_{index:02d}",
            (x, y, 1.06),
            (x + 0.025, y + 0.01, 1.25 + (index % 2) * 0.025),
            0.004,
            materials["bamboo"],
        )


def remove_source_geometry_in_box(
    minimum: tuple[float, float, float],
    maximum: tuple[float, float, float],
) -> None:
    """Remove the source condiment dispenser while preserving the carcass."""
    min_vec = Vector(minimum)
    max_vec = Vector(maximum)
    for obj in list(bpy.context.scene.objects):
        if obj.type != "MESH" or not obj.name.startswith("nacho-and-hot-dog-counter_"):
            continue
        mesh = obj.data
        bm = bmesh.new()
        bm.from_mesh(mesh)
        doomed = []
        for vertex in bm.verts:
            world = obj.matrix_world @ vertex.co
            if all(min_vec[axis] <= world[axis] <= max_vec[axis] for axis in range(3)):
                doomed.append(vertex)
        if doomed:
            bmesh.ops.delete(bm, geom=doomed, context="VERTS")
            bm.to_mesh(mesh)
            mesh.update()
        bm.free()

def build_taiwan_oden_counter(input_path: str, font_path: str | None) -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=input_path)

    # The source's meshes 4-6 are the roller grill, hot dogs and cheese unit.
    # Keep the counter carcass, sneeze guard and lamp rail, then replace only
    # the western hot-food hardware.
    for obj in list(bpy.context.scene.objects):
        if obj.name.endswith(("_4", "_5", "_6")):
            bpy.data.objects.remove(obj, do_unlink=True)

    # The tall western cheese/condiment dispenser shares a material primitive
    # with other source details, so remove only its occupied world-space volume.
    remove_source_geometry_in_box((0.18, -0.29, 0.91), (0.53, 0.22, 1.34))

    root = bpy.data.objects.get("nacho-and-hot-dog-counter")
    if root:
        root.name = "Taiwan_Convenience_Store_Oden_Counter"
        root["asset_role"] = "taiwanese_oden_hot_food_counter"
        root["source_license"] = "CC0-1.0"

    mats = {
        "steel": material("Oden Stainless Steel", "#aab7c0", metallic=0.82, roughness=0.24),
        "dark_steel": material("Oden Dark Steel", "#46545e", metallic=0.7, roughness=0.28),
        "broth": material("Soy Dashi Broth", "#722708", metallic=0.05, roughness=0.18),
        "daikon": material("Simmered Daikon", "#ffe9a3", roughness=0.62),
        "egg": material("Tea Egg", "#9f461d", roughness=0.52),
        "fish_ball": material("Fish Ball", "#f19b63", roughness=0.58),
        "tofu": material("Fried Tofu", "#d9701f", roughness=0.66),
        "konjac": material("Konjac", "#625a57", roughness=0.72),
        "chikuwa": material("Chikuwa", "#bc4d20", roughness=0.58),
        "bamboo": material("Bamboo Skewer", "#e8c36f", roughness=0.72),
        "orange": material("Taiwan Oden Orange", "#ef4f1b", roughness=0.35),
        "white": material("Warm White Lettering", "#fff8e8", roughness=0.4, emission="#fff1cf", emission_strength=0.12),
        "steam": material("Warm Steam", "#fffaf0", roughness=0.2, alpha=0.38),
    }

    # The inset stainless well conceals the removed western equipment and
    # anchors six individually stocked soup compartments.
    box("Oden_Well_Base", (1.02, 0.58, 0.10), (0.0, 0.0, 0.975), mats["dark_steel"], bevel=0.025)
    box("Oden_Well_Rim", (0.96, 0.53, 0.055), (0.0, 0.0, 1.015), mats["steel"], bevel=0.022)

    pan_positions = [
        (-0.31, -0.12), (0.0, -0.12), (0.31, -0.12),
        (-0.31, 0.12), (0.0, 0.12), (0.31, 0.12),
    ]
    for index, (x, y) in enumerate(pan_positions):
        build_food_compartment(index, x, y, mats["steel"], mats["broth"])

    add_ingredients(mats)

    # Two hinged lids are shown open so the food remains visible.
    for index, x in enumerate((-0.31, 0.31)):
        lid = cylinder(
            f"Oden_Open_Lid_{index:02d}",
            0.115,
            0.014,
            (x, 0.255, 1.155),
            mats["steel"],
            rotation=(math.radians(68), 0.0, 0.0),
            vertices=24,
        )
        lid.scale.y = 0.83
        rod(
            f"Oden_Lid_Handle_{index:02d}",
            (x - 0.035, 0.205, 1.18),
            (x + 0.035, 0.205, 1.18),
            0.008,
            mats["dark_steel"],
        )

    # Serving tongs and ladle sit at the customer-facing edge.
    rod("Serving_Tongs_Left", (0.40, -0.27, 1.07), (0.50, -0.08, 1.10), 0.006, mats["steel"])
    rod("Serving_Tongs_Right", (0.43, -0.28, 1.07), (0.515, -0.075, 1.10), 0.006, mats["steel"])
    cylinder("Serving_Tongs_Hinge", 0.013, 0.022, (0.415, -0.275, 1.07), mats["dark_steel"], rotation=(math.radians(90), 0, 0))
    rod("Soup_Ladle_Handle", (-0.50, -0.22, 1.07), (-0.42, 0.02, 1.16), 0.008, mats["steel"])
    sphere("Soup_Ladle_Bowl", 0.043, (-0.505, -0.235, 1.065), mats["steel"], scale=(1.0, 0.72, 0.28))

    add_vertical_label(font_path, mats["orange"], mats["white"])

    # Subtle steam curls add warmth without requiring an animated effect.
    steam_curve("Oden_Steam_Left", [(-0.25, -0.08, 1.12), (-0.28, -0.06, 1.22), (-0.22, -0.04, 1.32)], mats["steam"])
    steam_curve("Oden_Steam_Center", [(0.02, 0.02, 1.12), (0.07, 0.01, 1.23), (0.01, 0.0, 1.34)], mats["steam"])
    steam_curve("Oden_Steam_Right", [(0.29, -0.06, 1.12), (0.25, -0.04, 1.21), (0.31, -0.02, 1.30)], mats["steam"])

    # Lift the food well above the source splash guard so individual soup
    # compartments and ingredients remain readable from the game camera.
    raised_prefixes = (
        "Oden_Pan_", "Oden_Broth_", "Daikon_", "Tea_Egg_",
        "Fish_Ball_", "Fried_Tofu_", "Konjac_", "Chikuwa_", "Bamboo_Skewer_",
        "Oden_Open_Lid_", "Oden_Lid_Handle_", "Serving_", "Soup_Ladle_", "Oden_Steam_",
    )
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(raised_prefixes):
            obj.location.z += 0.055

    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj["gameplay_role"] = "oden_counter_detail" if obj.name.startswith(("Oden_", "Daikon_", "Tea_", "Fish_", "Fried_", "Konjac_", "Chikuwa_", "Bamboo_", "Serving_", "Soup_")) else "counter_base"


def look_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def render_preview(path: str) -> None:
    preview_floor = box("Preview Floor", (4.0, 4.0, 0.04), (0.0, 0.0, -0.04), material("Preview Floor", "#eee7dc", roughness=0.9), bevel=0)
    preview_floor["preview_only"] = True

    bpy.ops.object.light_add(type="AREA", location=(2.2, -2.2, 3.0))
    key = bpy.context.object
    key.data.energy = 720
    key.data.shape = "DISK"
    key.data.size = 3.0
    look_at(key, (0.0, 0.0, 0.7))

    bpy.ops.object.light_add(type="AREA", location=(-2.0, -0.5, 1.8))
    fill = bpy.context.object
    fill.data.energy = 420
    fill.data.size = 2.2
    look_at(fill, (0.0, 0.0, 0.75))

    bpy.ops.object.camera_add(location=(2.15, -2.55, 2.18))
    camera = bpy.context.object
    camera.data.lens = 58
    look_at(camera, (0.0, 0.0, 0.82))
    bpy.context.scene.camera = camera

    world = bpy.context.scene.world or bpy.data.worlds.new("Preview World")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = rgba("#f5eee5")
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.55

    scene = bpy.context.scene
    # CPU Cycles works in CI/headless Windows sessions without an OpenGL vendor.
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.filepath = path
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.7
    bpy.ops.render.render(write_still=True)


def main() -> None:
    args = parse_args()
    input_path = os.path.abspath(args.input)
    output_path = os.path.abspath(args.output)
    blend_path = os.path.abspath(args.blend)
    preview_path = os.path.abspath(args.preview)
    for path in (output_path, blend_path, preview_path):
        os.makedirs(os.path.dirname(path), exist_ok=True)

    font_path = r"C:\Windows\Fonts\msjhbd.ttc"
    build_taiwan_oden_counter(input_path, font_path)

    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_extras=True,
        export_cameras=False,
        export_lights=False,
    )
    render_preview(preview_path)
    print(f"TAIWAN_ODEN_GLB={output_path}")
    print(f"TAIWAN_ODEN_BLEND={blend_path}")
    print(f"TAIWAN_ODEN_PREVIEW={preview_path}")


if __name__ == "__main__":
    main()
