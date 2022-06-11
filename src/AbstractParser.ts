import { ApplicativeHKT, CallHKT, FunctorHKT, Monad, MonadHKT, None, Ok, Optional, Result, Some } from 'monads-co'
import { inspect } from 'util'

export interface ParserHKT<InputT> extends MonadHKT {
  output: Parser<InputT, this["input"]>
}


class ParserFailed {
  constructor(public line: number, public reason: string) {
  }
}


abstract class Parser<InputT, ResultT> extends Monad<ResultT> {
  abstract parse<HKT extends ApplicativeHKT>(input: InputT): CallHKT<HKT, ResultT>

  map<B, HKT extends ParserHKT<InputT>>(mapping: (value: ResultT) => B): CallHKT<HKT, B> {
    return new MapParser<InputT, ResultT, B, HKT>(this.parse.bind(this), mapping)
  }

  amap<B, HKT extends ParserHKT<InputT>>(mapping: CallHKT<HKT, (value: ResultT) => B>): CallHKT<HKT, B> {
    return new AMapParser<InputT, ResultT, B, HKT>(this.parse.bind(this), mapping)
  }

  pure<B>(value: B): Parser<InputT, B> {
    return new PureParser<InputT, B>(value)
  }

  then<B, HKT extends ParserHKT<InputT>>(mapping: (value: ResultT) => CallHKT<HKT, B>): CallHKT<HKT, B> {
    return new ThenParser<InputT, ResultT, B, HKT>(this.parse.bind(this), mapping)
  }
}


export interface ResultParserHKT<ValueT, ErrorT> extends ParserHKT<unknown> {
  output: ResultParser<ValueT, ErrorT>
}


export class ResultParser<ValueT, ErrorT> extends Parser<unknown, Result<ValueT, ErrorT>> {
  constructor(public _success: boolean, public _value: ValueT | ErrorT) {
    super()
  }

  parse(): Result<ValueT, ErrorT> {
    return new Result<ValueT, ErrorT>(this._success, this._value)
  }

  unwrap(): ValueT {
    if (this._success) {
      return this._value as ValueT
    }

    else throw "No parser result"
  }
}


function ParserOk<ValueT, ErrorT>(value: ValueT) {
  return new ResultParser<ValueT, ErrorT>(true, value)
}


function ParserErr<ValueT, ErrorT>(value: ErrorT) {
  return new ResultParser<ValueT, ErrorT>(true, value)
}


export class StringParser extends Parser<[string, string], [string, string]> {
  constructor(private _term: string) {
    super()
  }

  parse([input, value]: [string, string]): ResultParser<[string, string], undefined> {
    console.log(input, this._term)
    if (input.startsWith(this._term)) {
      console.log('yey')
      return ParserOk([input.slice(this._term.length), this._term])
    }

    return ParserErr(undefined)
  }
}


class ThenParser<InputT, ResultT, MappedResultT, HKT extends MonadHKT> extends Parser<InputT, MappedResultT> {
  constructor(
    private _parse: (input: InputT) => CallHKT<HKT, ResultT>,
    private _mapping: (value: ResultT) => CallHKT<HKT, MappedResultT>
  ) {
    super()
  }

  parse(input: InputT): CallHKT<HKT, MappedResultT> {
    const out = this._parse(input).then(
      // @ts-ignore
      this._mapping
    )

    console.log('then', input, out)
    return out
  }
}


class MapParser<InputT, ResultT, MappedResultT, HKT extends MonadHKT> extends Parser<InputT, MappedResultT> {
  constructor(
    private _parse: (input: InputT) => CallHKT<HKT, ResultT>,
    private _mapping: (value: ResultT) => MappedResultT
  ) {
    super()
  }

  parse(input: InputT): CallHKT<HKT, MappedResultT> {
    const out = this._parse(input).map<MappedResultT, HKT>(
      // @ts-ignore
      this._mapping
    )

    console.log('map', input, out)
    return out
  }
}


class AMapParser<InputT, ResultT, MappedResultT, HKT extends MonadHKT> extends Parser<InputT, MappedResultT> {
  constructor(
    private _parse: (input: InputT) => CallHKT<HKT, ResultT>,
    private _mapping: CallHKT<HKT, (value: ResultT) => MappedResultT>
  ) {
    super()
  }

  parse(input: InputT): CallHKT<HKT, MappedResultT> {
    const out = this._parse(input).amap(
      // @ts-ignore
      this._mapping
    )

    debugger

    return out
  }
}


class PureParser<InputT, ResultT> extends Parser<InputT, ResultT> {
  constructor(
    private _value: ResultT
  ) {
    super()
  }

  parse(input: InputT) {
    const out = this.map(() => input)
    console.log(out)
    return out
  }
}
