"""Print connected-component bounds for a GLB to support non-destructive edits."""

from __future__ import annotations

import os
import sys

import bpy
from mathutils import Vector


input_path = os.path.abspath(sys.argv[sys.argv.index("--") + 1])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=input_path)

for obj in bpy.context.scene.objects:
    if obj.type != "MESH":
        continue
    mesh = obj.data
    adjacency = [set() for _ in mesh.vertices]
    for edge in mesh.edges:
        a, b = edge.vertices
        adjacency[a].add(b)
        adjacency[b].add(a)

    remaining = set(range(len(mesh.vertices)))
    components = []
    while remaining:
        seed = remaining.pop()
        component = {seed}
        queue = [seed]
        while queue:
            current = queue.pop()
            linked = adjacency[current] & remaining
            remaining.difference_update(linked)
            component.update(linked)
            queue.extend(linked)
        components.append(component)

    print(f"OBJECT {obj.name} components={len(components)}")
    for index, component in enumerate(sorted(components, key=len, reverse=True)):
        points = [obj.matrix_world @ mesh.vertices[vertex].co for vertex in component]
        minimum = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
        maximum = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
        center = (minimum + maximum) * 0.5
        size = maximum - minimum
        print(
            f"  COMPONENT {index:02d} vertices={len(component):4d} "
            f"center=({center.x:.3f},{center.y:.3f},{center.z:.3f}) "
            f"size=({size.x:.3f},{size.y:.3f},{size.z:.3f})"
        )
