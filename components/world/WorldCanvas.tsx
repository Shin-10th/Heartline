import { Canvas, Rect, RoundedRect, Circle, Group } from "@shopify/react-native-skia";
import type { PaletteColors } from "../../theme/palettes";

type Props = {
  width: number;
  height: number;
  colors: PaletteColors;
  unlockedDecorIds: string[];
};

// Pixel-art shared "World" room, rendered with React Native Skia -- both
// partners' avatars living together, plus decor unlocked by streak
// milestones (couples/{id}/world.decorUnlocked, spec section 5.7). These
// are simple geometric placeholders standing in for the real pixel-sprite
// art pipeline (photo -> hosted image model -> sprite, §5.7/§9).
export function WorldCanvas({ width, height, colors, unlockedDecorIds }: Props) {
  const floorY = height * 0.72;

  return (
    <Canvas style={{ width, height }}>
      {/* room shell */}
      <Rect x={0} y={0} width={width} height={floorY} color={colors.peachSoft} />
      <Rect x={0} y={floorY} width={width} height={height - floorY} color={colors.pinkSoft} />

      {/* fairy lights along the top edge */}
      {unlockedDecorIds.includes("fairy-lights") &&
        Array.from({ length: 7 }).map((_, i) => (
          <Circle key={`light-${i}`} cx={(width / 8) * (i + 1)} cy={14} r={4} color={colors.peach} />
        ))}

      {/* rug */}
      {unlockedDecorIds.includes("rug") && (
        <RoundedRect x={width * 0.28} y={floorY + 14} width={width * 0.44} height={height * 0.14} r={14} color={colors.lavSoft} />
      )}

      {/* bookshelf */}
      {unlockedDecorIds.includes("bookshelf") && (
        <Group>
          <RoundedRect x={16} y={floorY - 70} width={34} height={70} r={4} color={colors.peach} />
          <Rect x={19} y={floorY - 58} width={28} height={4} color={colors.bg} />
          <Rect x={19} y={floorY - 42} width={28} height={4} color={colors.bg} />
          <Rect x={19} y={floorY - 26} width={28} height={4} color={colors.bg} />
        </Group>
      )}

      {/* star jar */}
      {unlockedDecorIds.includes("star-jar") && (
        <Group>
          <RoundedRect x={width - 50} y={floorY - 46} width={28} height={36} r={8} color={colors.lavSoft} />
          <Circle cx={width - 42} cy={floorY - 30} r={2.5} color={colors.peach} />
          <Circle cx={width - 32} cy={floorY - 24} r={2} color={colors.pink} />
          <Circle cx={width - 38} cy={floorY - 16} r={2} color={colors.lav} />
        </Group>
      )}

      {/* two pixel selves, standing together */}
      <Group>
        <RoundedRect x={width * 0.5 - 34} y={floorY - 46} width={26} height={46} r={8} color={colors.pink} />
        <Circle cx={width * 0.5 - 21} cy={floorY - 54} r={13} color={colors.pink} />
      </Group>
      <Group>
        <RoundedRect x={width * 0.5 + 8} y={floorY - 46} width={26} height={46} r={8} color={colors.lav} />
        <Circle cx={width * 0.5 + 21} cy={floorY - 54} r={13} color={colors.lav} />
      </Group>
    </Canvas>
  );
}
