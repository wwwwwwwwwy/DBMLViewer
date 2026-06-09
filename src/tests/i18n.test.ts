import { describe, expect, it } from 'vitest'
import { defaultLanguage, t } from '../i18n'

describe('i18n', () => {
  it('uses Chinese as the default language', () => {
    expect(defaultLanguage).toBe('zh')
    expect(t(defaultLanguage, 'editor.statusSynced')).toBe('已同步')
  })

  it('translates the same key to English', () => {
    expect(t('en', 'editor.statusSynced')).toBe('Synced')
  })
})
