# Store GLB assets

The files in this folder are selected from the `Pixel Modern Supermarket` pack:

- Source: https://3dassets.dev/packs/pixel-modern-supermarket
- License: CC0 1.0 Universal
- Pack license: https://creativecommons.org/publicdomain/zero/1.0/
- Downloaded locally on 2026-09-30 for use as Blender/Godot-compatible GLB assets.

The game loads these files through Three.js `GLTFLoader`. They can also be imported
into Blender or Godot as standard glTF binary scenes.

## Additional hot-food equipment

`oden-hot-food-counter.glb` is based on the **Nacho and Hot Dog Counter Unit**
from the Cinema Multiplex and Foyer pack. It is used as the dedicated heated
food counter for oden instead of reusing a generic shelf.

- Asset page: https://3dassets.dev/assets/cinema-multiplex-and-foyer-nacho-and-hot-dog-counter-686a7c9e
- Model source: https://cdn.3dassets.dev/assets/34671/v1/model.glb
- License: CC0 1.0 Universal
- Downloaded locally on 2026-10-02.

The shipped GLB was rebuilt in Blender as a Taiwanese convenience-store oden
counter. The western roller grill and condiment unit were removed and replaced
with six heated soup wells, open lids, serving tongs, a ladle, steam, bamboo
skewers, daikon, tea eggs, fish balls, tofu, konjac, chikuwa, and a `關東煮` sign.

Editable sources and regeneration tools:

- `scripts/blender/oden-hot-food-counter.blend`
- `scripts/blender/build_taiwan_oden_counter.py`
- `scripts/blender/source/oden-hot-food-counter-source.glb`
- `scripts/blender/previews/oden-hot-food-counter.png`
