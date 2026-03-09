import { describe, it, expect } from 'vitest'
import { cleanJsonResponse } from '@/lib/ai'

describe('cleanJsonResponse', () => {
  it('parses raw JSON', () => {
    const result = cleanJsonResponse('{"key": "value"}')
    expect(result).toEqual({ key: 'value' })
  })

  it('strips markdown json fences', () => {
    const result = cleanJsonResponse('```json\n{"key": "value"}\n```')
    expect(result).toEqual({ key: 'value' })
  })

  it('strips plain markdown fences', () => {
    const result = cleanJsonResponse('```\n{"key": "value"}\n```')
    expect(result).toEqual({ key: 'value' })
  })

  it('handles whitespace around fences', () => {
    const result = cleanJsonResponse('```json\n  {"key": "value"}  \n```')
    expect(result).toEqual({ key: 'value' })
  })

  it('throws on invalid JSON', () => {
    expect(() => cleanJsonResponse('not json')).toThrow()
  })
})
