import type { Material } from 'three';

export const getMaterialsArray = async (
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
      throw new Error(`getMaterialsArray didn't find ${materialId} in materials object`);
    }

    acc.push(material);

    return acc;
  }, []);
};
