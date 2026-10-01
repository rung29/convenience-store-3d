# Character assets

These GLB files are from the [Pixel Modern Supermarket](https://3dassets.dev/packs/pixel-modern-supermarket) asset pack.

The pack is released under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). The files are bundled locally so the game does not depend on a remote CDN at runtime.

Character roles used by the game:

- shoppers with trolley or basket
- shopper reaching for a shelf
- child with balloon
- cashier
- shelf stacker
- deli assistant
- self-checkout shopper
- security guard
- elderly shopper
- manager
- delivery driver

## B: Godot Chibi Characters

These GLB files are from the [Godot Asset Store Chibi Characters](https://store.godotengine.org/asset/styloo/chibi/) pack by styloo.

The source page lists the pack under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) and includes five themed characters plus a base mesh: archer, knight, merchant, ninja, student, and base mesh. The package also includes idle, walk, run, jump, crouch, push, flip, and dying animations.

The files are bundled locally so the game does not depend on a remote CDN at runtime. The in-game `角色 A / 角色 B` button switches existing and newly spawned customers between the original set and this chibi set.
## C: KayKit Adventurers

The C character set uses the five free characters from [KayKit Adventurers](https://kaylousberg.itch.io/kaykit-adventurers): Knight, Barbarian, Mage, Rogue, and Rogue Hooded. The pack is distributed under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/), with source files mirrored from the [official GitHub repository](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0).

These are rigged animated GLB files. The existing customer animation controller uses their embedded idle and walking clips, so C customers can move through the same shopping states as A and B.

## Local store and street assets

- [Kenney Mini Market](https://kenney.nl/assets/mini-market) supplies the register, food displays, freezer, cart, basket, and bottle-return props. It is CC0; the local license is kept in `public/models/external/kenney/KENNEY-MINI-MARKET-LICENSE.txt`.
- [KayKit City Builder Bits](https://kaylousberg.itch.io/city-builder-bits) supplies the road tiles, buildings, vehicles, street furniture, lights, and small street details. It is CC0; the local license is kept in `public/models/external/kaykit/KAYKIT-CITY-BUILDER-BITS-LICENSE.txt`.

The imported scenery is static and deliberately excluded from the draggable decoration/collision registry, so it enriches the framing without blocking store placement or customer paths.

## Test characters

`public/models/RobotExpressive.glb` and `public/models/Soldier.glb` are optional test characters with skeletal animations. The in-game `測試 OFF / 測試 ON` switch replaces current and newly spawned customers with these two models. Turning it off restores the selected A/B character set.
