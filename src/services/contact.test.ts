import { whatsAppNumber } from './contact';

describe('whatsAppNumber', () => {
  it('prefixes 91 to a 10-digit Indian mobile number', () => {
    expect(whatsAppNumber('98765 43210')).toBe('919876543210');
  });

  it('drops a leading trunk 0 before prefixing 91', () => {
    expect(whatsAppNumber('09876543210')).toBe('919876543210');
  });

  it('keeps an explicit international number as-is without the +', () => {
    expect(whatsAppNumber('+91 98765-43210')).toBe('919876543210');
    expect(whatsAppNumber('+1 (415) 555-0100')).toBe('14155550100');
  });

  it('keeps a number that already includes the country code', () => {
    expect(whatsAppNumber('919876543210')).toBe('919876543210');
  });

  it('returns empty for a number with no digits', () => {
    expect(whatsAppNumber('  ')).toBe('');
  });
});
