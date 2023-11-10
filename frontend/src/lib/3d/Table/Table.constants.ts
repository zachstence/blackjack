import { Vector3 } from 'three';
import { CARD_HEIGHT, CARD_WIDTH } from '../Card/Card.constants';
import { polarToRectangular } from '../polar';

export const TABLE_RADIUS = 914.4;

export const TABLE_OUTLINE_WIDTH = 10;

export const TABLE_ARC_INNER_RADIUS = 304.8;

export const TABLE_ARC_CENTER_X = 0;

export const TABLE_ARC_CENTER_Z = TABLE_RADIUS / 2 - TABLE_ARC_INNER_RADIUS;

export const TABLE_ARC_THICKNESS = 120;

export const NUM_TABLE_SEATS = 7;

const TABLE_ARC_ANGLE = Math.PI * 0.8;

export const TABLE_ARC_START_ANGLE = Math.PI / 2 - TABLE_ARC_ANGLE / 2;

export const TABLE_ARC_END_ANGLE = TABLE_ARC_START_ANGLE + TABLE_ARC_ANGLE;

export const TABLE_ARC_BET_BOX_D_ANGLE = TABLE_ARC_ANGLE / (NUM_TABLE_SEATS - 1);

export const TABLE_BET_BOX_WIDTH = CARD_WIDTH;

export const TABLE_BET_BOX_HEIGHT = CARD_HEIGHT;

export const TABLE_BET_BOX_PADDING = 25.4;

const TABLE_BET_BOX_RADIUS =
  TABLE_ARC_INNER_RADIUS + TABLE_ARC_THICKNESS + TABLE_BET_BOX_PADDING + TABLE_BET_BOX_HEIGHT / 2;

export const BET_BOXES: { position: Vector3; rotationY: number }[] = Array.from({ length: NUM_TABLE_SEATS }).map(
  (_, i) => {
    const a = TABLE_ARC_START_ANGLE + TABLE_ARC_BET_BOX_D_ANGLE * i;
    const { x, y: z } = polarToRectangular(TABLE_BET_BOX_RADIUS, a);
    return {
      position: new Vector3(x + TABLE_ARC_CENTER_X, 0, z + TABLE_ARC_CENTER_Z),
      rotationY: a,
    };
  },
);
