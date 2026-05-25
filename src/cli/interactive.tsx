import React, { FC, useMemo, useState } from 'react';
import { Box, Text, render, useApp, useInput } from 'ink';

export interface InteractiveSelectOption<T> {
  label: string;
  value: T;
  description?: string;
}

interface SelectorProps<T> {
  title: string;
  options: InteractiveSelectOption<T>[];
  onSelect: (value: T) => void;
}

const Selector = <T,>({ title, options, onSelect }: SelectorProps<T>) => {
  const { exit } = useApp();
  const [idx, setIdx] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) setIdx((old) => (old - 1 + options.length) % options.length);
    if (key.downArrow) setIdx((old) => (old + 1) % options.length);
    if (key.return) {
      onSelect(options[idx].value);
      exit();
    }
    if (input === 'q') exit();
  });

  return (
    <Box flexDirection="column">
      <Text color="cyan">{title}</Text>
      <Text dimColor>使用 ↑/↓ 选择，Enter 确认，q 退出</Text>
      <Box marginTop={1} flexDirection="column">
        {options.map((opt, i) => (
          <Text key={`${i}-${opt.label}`} color={i === idx ? 'green' : undefined}>
            {i === idx ? '❯' : ' '} {opt.label}
            {opt.description ? ` - ${opt.description}` : ''}
          </Text>
        ))}
      </Box>
    </Box>
  );
};

export const promptSelect = async <T,>(
  title: string,
  options: InteractiveSelectOption<T>[]
): Promise<T | undefined> => {
  if (options.length === 0) return undefined;

  return new Promise<T | undefined>((resolve) => {
    let settled = false;
    const done = (value: T | undefined) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const App: FC = () => {
      const normalized = useMemo(() => options, []);
      return <Selector title={title} options={normalized} onSelect={(v) => done(v)} />;
    };

    const app = render(<App />);
    app.waitUntilExit().then(() => done(undefined));
  });
};
