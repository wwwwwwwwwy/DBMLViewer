import { Parser, type Database } from '@dbml/core'
import type { ParseError } from './dbmlTypes'

type ParseSuccess = {
  ok: true
  database: Database
  parser: 'dbmlv2' | 'dbml'
}

type ParseFailure = {
  ok: false
  error: ParseError
}

export type ParseResult = ParseSuccess | ParseFailure

export function parseDbmlSource(source: string): ParseResult {
  const trimmedSource = source.trim()

  if (!trimmedSource) {
    return {
      ok: false,
      error: {
        message: 'Failed to parse DBML',
        details: 'The DBML document is empty.',
      },
    }
  }

  const attempts: Array<'dbmlv2' | 'dbml'> = ['dbmlv2', 'dbml']
  const errors: string[] = []

  for (const parser of attempts) {
    try {
      return {
        ok: true,
        database: Parser.parse(trimmedSource, parser),
        parser,
      }
    } catch (error) {
      errors.push(formatUnknownError(error))
    }
  }

  return {
    ok: false,
    error: {
      message: 'Failed to parse DBML',
      details: errors.filter(Boolean).join('\n\n'),
    },
  }
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown parser error.'
  }
}

