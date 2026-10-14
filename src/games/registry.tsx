/**
 * Activity renderer registry: maps a question `kind` to the React component that plays it.
 * A new subject registers its own renderers here (see docs/ADDING_A_SUBJECT.md).
 */
import type { ComponentType } from 'react';
import type { MathsQuestion } from '../subjects/maths/types';
import { BalloonGame } from './BalloonGame';
import { CatchGame } from './CatchGame';
import { ChooseGame } from './ChooseGame';
import { CountGame } from './CountGame';
import { FeedGame } from './FeedGame';
import { NumberLineGame } from './NumberLineGame';
import { PatternGame } from './PatternGame';
import { PizzaGame } from './PizzaGame';
import { ShapesGame } from './ShapesGame';
import { ShopGame } from './ShopGame';
import { TowerGame } from './TowerGame';
import { TrainGame } from './TrainGame';
import { TreasureGame } from './TreasureGame';
import type { GameProps } from './types';

type AnyGame = ComponentType<GameProps<MathsQuestion>>;

export const GAME_COMPONENTS: Record<string, AnyGame> = {
  count: CountGame as AnyGame,
  feed: FeedGame as AnyGame,
  balloon: BalloonGame as AnyGame,
  train: TrainGame as AnyGame,
  treasure: TreasureGame as AnyGame,
  pizza: PizzaGame as AnyGame,
  shapes: ShapesGame as AnyGame,
  catch: CatchGame as AnyGame,
  pattern: PatternGame as AnyGame,
  shop: ShopGame as AnyGame,
  numberline: NumberLineGame as AnyGame,
  tower: TowerGame as AnyGame,
  choose: ChooseGame as AnyGame,
};
