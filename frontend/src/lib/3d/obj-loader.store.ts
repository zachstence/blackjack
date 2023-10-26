import { writable, type Readable } from 'svelte/store';
import { Mesh, type Group, type Material, type Object3DEventMap } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

type LoadedOBJ = Group<Object3DEventMap>;

export class OBJLoaderStore implements Readable<LoadedOBJ | undefined> {
  private _store = writable<LoadedOBJ | undefined>();

  private _object: Group<Object3DEventMap> | undefined;

  constructor(public objFilepath: string, public materials: { [materialId: string]: Material }) {}

  subscribe: Readable<LoadedOBJ | undefined>['subscribe'] = (run, invalidate) => {
    return this._store.subscribe(run, invalidate);
  };

  get object(): LoadedOBJ | undefined {
    return this._object;
  }

  load = async (): Promise<void> => {
    await Promise.all([this.loadObject(), this.loadMaterials()]);
    this.tick();
  };

  setMaterial = (materialId: string, material: Material): void => {
    this.materials[materialId] = material;
    this.loadMaterials();
    this.tick();
  };

  private loadObject = (): Promise<void> => {
    return new Promise((resolve) => {
      const loader = new OBJLoader();
      loader.load(this.objFilepath, (object) => {
        this._object = object;
        resolve();
      });
    });
  };

  private loadMaterials = async (): Promise<void> => {
    const materials = await buildObjMaterials(this.objFilepath, this.materials);

    if (!this._object) return;
    this._object.traverse((child) => {
      if (child instanceof Mesh) {
        console.log('updated materials');
        child.material = materials;
      }
    });
  };

  private tick = (): void => {
    this._store.set(this._object);
  };
}

const buildObjMaterials = async (
  objFilePath: string,
  materials: { [materialId: string]: Material },
): Promise<Material[]> => {
  const response = await fetch(objFilePath);
  const objContents = await response.text();

  return objContents.split('\n').reduce<Material[]>((acc, line) => {
    if (!line.startsWith('usemtl')) return acc;

    const [_, materialId] = line.trim().split(' ');
    const material = materials[materialId];
    if (!material) {
      console.warn(`OBJ '${objFilePath}' uses material ${materialId} which was not included in materials object`);
    }

    acc.push(material);

    return acc;
  }, []);
};
