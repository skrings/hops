import React from 'react';
import { importComponent } from 'hops';

const Text = importComponent('./text');
const AnotherText = importComponent('./text');

const TextContainer = () => {
  return (
    <div>
      <Text text="hello" />
      <AnotherText text="bye" />
    </div>
  );
};

export default TextContainer;
