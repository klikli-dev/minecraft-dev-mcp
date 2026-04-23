import { describe, expect, it } from 'vitest';
import { getJsonArgumentError } from '../src/cli-utils.js';

describe('CLI JSON argument errors', () => {
  it('detects PowerShell-mangled pseudo-JSON', () => {
    const message = getJsonArgumentError('{version:26.1.2,className:net.minecraft.client.Minecraft,mapping:mojmap}');

    expect(message).toContain('PowerShell');
    expect(message).toContain('--version/--className/--mapping');
  });

  it('provides a general PowerShell-friendly fallback message', () => {
    const message = getJsonArgumentError('{bad json');

    expect(message).toContain('properly formatted');
    expect(message).toContain('PowerShell');
  });
});
