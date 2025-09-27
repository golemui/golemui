import { render } from '@testing-library/react';

import ReactVanilla from './react-vanilla';

describe('ReactVanilla', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ReactVanilla />);
    expect(baseElement).toBeTruthy();
  });
});
