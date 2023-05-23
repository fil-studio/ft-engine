# Fil Toolkit's Engine
A set of public packages used by the back-end and front-end FT instances.

These packages contain the necessary utilities for managing Editor's associated data. We start with our `three` package which targets utilities for parsing standard scenes, materials and texture libraries created from our Scene Editor. These utilities are built on top of [ThreeJS](https://threejs.org/).

The packages are written in TypeScript.

These packages work on top of fil toolkit's infrastructure. They might result completely useless if not vinculated to FT back-end. Our editor is currently private and only available to our clients.

## Available Packages

| Package | Description |
|:--|:--|
| [@ft-engine/three](https://www.npmjs.com/package/@ft-engine/three) | Utilities for parsing our standard scenes, texture and material libraries. |

## License
© Copyright 2023, fil studio

[fil](https://fil.studio) is a studio with a creative tech soul. We build bespoke interactive journeys primarily using modern web technologies. We deliver tailored solutions for installations and on-line experiences using our internal toolkit + [ThreeJS](https://threejs.org).

fil is the Catalan word for thread. We love threads cause we often talk about them when building applications and, at the same time, threads are something so organic, colourful and playful.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.