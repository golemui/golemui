// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GuiFileUpload } from './file-upload';
import './file-upload';

// The missing upload service is reported once the host passed its dependencies, so an element
// that renders before its framework sets them (Vue hydrating server markup) does not report it.
describe('the missing uploadService error', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  const connect = async (setup?: (element: GuiFileUpload) => void) => {
    const element = document.createElement('gui-file-upload');
    element.uid = 'upload';
    element.label = 'Files';
    setup?.(element);
    document.body.append(element);
    await element.updateComplete;
    return element;
  };

  it('is not reported before the dependencies are set', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await connect();
    expect(error).not.toHaveBeenCalled();
  });

  it('is reported once when the dependencies have no uploadService', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const element = await connect();
    element.dependencies = {};
    await element.updateComplete;
    element.label = 'Again';
    await element.updateComplete;
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0]?.[0]).toContain('has no uploadService');
  });

  it('is not reported when the dependencies have one', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await connect((element) => {
      element.dependencies = { uploadService: { upload: async () => ({ url: '' }) } as never };
    });
    expect(error).not.toHaveBeenCalled();
  });
});
