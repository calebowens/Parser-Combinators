import {
  ApplicativeHKT,
  CallHKT,
  Err,
  FunctorHKT,
  Monad,
  MonadHKT,
  None,
  Ok,
  Optional,
  Result,
  ResultHKT,
  Some
} from 'monads-co'
import { inspect } from 'util'

export interface ParserHKT<InputT, ParserFailedT> extends MonadHKT {
  output: Parser<InputT, this["input"], ParserFailedT>
}


class ParserFailed {
  constructor(public line: number, public reason: string) {
  }
}


abstract class Parser<InputT, ResultT, ParserFailedT> extends Monad<ResultT> {
  abstract parse(input: ParserInput<InputT>): Result<ParserResult<InputT, ResultT>, ParserFailedT>

  map<B>(mapping: (value: ResultT) => B) {
    return new MapParser<InputT, ResultT, B, ParserFailedT>(this.parse.bind(this), mapping)
  }

  amap<B, HKT extends ParserHKT<InputT, ParserFailedT>>(mapping: CallHKT<HKT, (value: ResultT) => B>): AMapParser<InputT, ResultT, B, ParserFailedT, HKT> {
    return new AMapParser<InputT, ResultT, B, ParserFailedT, HKT>(this.parse.bind(this), mapping)
  }

  pure<B>(value: B): Parser<InputT, B, ParserFailedT> {
    return new PureParser<InputT, B, ParserFailedT>(value)
  }

  then<B, HKT extends ParserHKT<InputT, ParserFailedT>>(mapping: (value: ResultT) => CallHKT<HKT, B>): ThenParser<InputT, ResultT, B, ParserFailedT, HKT> {
    // @ts-ignore
    return new ThenParser<InputT, ResultT, B, ParserFailedT, HKT>(this.parse.bind(this), mapping)
  }
}


export class ParserInput<T> {
  constructor(public input: T, public position: number) {
  }
}


export class ParserResult<T, V> {
  constructor(public input: ParserInput<T>, public result: V) {}

  map<B>(mapping: (value: V) => B) {
    return new ParserResult(
      this.input,
      mapping(this.result)
    )
  }

  then<B, HKT extends MonadHKT>(mapping: (value: V) => CallHKT<HKT, B>) {
    return new ParserResult(
      this.input,
      mapping(this.result)
    )
  }

  amap<B, HKT extends MonadHKT>(mapping: CallHKT<HKT, (value: V) => B>): CallHKT<HKT, B> {
    return mapping.map<B, HKT>(
      // @ts-ignore
      (value: (value: V) => B) => value(this.result)
    )
  }
}


export class StringParser extends Parser<string, string, undefined> {
  constructor(private _term: string) {
    super()
  }

  parse(input: ParserInput<string>): Result<ParserResult<string, string>, undefined> {
    if (input.input.startsWith(this._term)) {
      console.log('yey')
      return Ok(
        new ParserResult<string, string>(
          new ParserInput(
            input.input.slice(this._term.length),
            input.position + this._term.length
          ),
          this._term
        )
      )
    }

    return Err(undefined)
  }
}


class ThenParser<InputT, ResultT, MappedResultT, ParserFailedT, HKT extends ParserHKT<InputT, ParserFailedT>> extends Parser<InputT, MappedResultT, ParserFailedT> {
  constructor(
    private _parse: (input: ParserInput<InputT>) => Result<ParserResult<InputT, ResultT>, ParserFailedT>,
    private _mapping: (value: ResultT) => Result<ParserResult<InputT, MappedResultT>, ParserFailedT>
  ) {
    super()
  }

  parse(input: ParserInput<InputT>): Result<ParserResult<InputT, MappedResultT>, ParserFailedT>{
    return this._parse(input).then(
      (parserResult) =>
        // @ts-ignore
        parserResult.then<MappedResultT, ResultHKT<ParserFailedT>>(this._mapping)
    )
  }
}


class MapParser<InputT, ResultT, MappedResultT, ParserFailedT> extends Parser<InputT, MappedResultT, ParserFailedT> {
  constructor(
    private _parse: (input: ParserInput<InputT>) => Result<ParserResult<InputT, ResultT>, ParserFailedT>,
    private _mapping: (value: ResultT) => MappedResultT
  ) {
    super()
  }

  parse(input: ParserInput<InputT>): Result<ParserResult<InputT, MappedResultT>, ParserFailedT> {
    return this._parse(input).map(
      (parserResult) => parserResult.map(this._mapping)
    )
  }
}


class AMapParser<InputT, ResultT, MappedResultT, ParserFailedT, HKT extends ParserHKT<InputT, ParserFailedT>> extends Parser<InputT, MappedResultT, ParserFailedT> {
  constructor(
    private _parse: (input: ParserInput<InputT>) => Result<ParserResult<InputT, ResultT>, ParserFailedT>,
    private _mapping: CallHKT<HKT, (value: ResultT) => MappedResultT>
  ) {
    super()
  }

  parse(input: ParserInput<InputT>): Result<ParserResult<InputT, MappedResultT>, ParserFailedT> {
    return this._parse(input).amap(
      // @ts-ignore
      this._mapping
    )
  }
}


class PureParser<InputT, ResultT, ParserFailedT> extends Parser<InputT, ResultT, ParserFailedT> {
  constructor(
    private _value: ResultT
  ) {
    super()
  }

  parse(input: ParserInput<InputT>): Result<ParserResult<InputT, ResultT>, ParserFailedT> {
    return Ok(
      new ParserResult(
        input,
        this._value
      )
    )
  }
}
