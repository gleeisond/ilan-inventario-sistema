import { Fragment } from 'react'

// Texto que aparece palavra por palavra, saindo do desfoque (estilo "blur reveal")
export default function TextoRevelado({ texto, atraso = 0 }: { texto: string; atraso?: number }) {
  return (
    <span className="revelar" aria-label={texto}>
      {texto.split(' ').map((palavra, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span aria-hidden="true" style={{ '--palavra': i + atraso } as React.CSSProperties}>
            {palavra}
          </span>
        </Fragment>
      ))}
    </span>
  )
}
