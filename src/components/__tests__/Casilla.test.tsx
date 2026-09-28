/**
 * La casilla nativa del navegador se ve distinta en cada sistema y es diminuta.
 * Esta la reemplaza conservando el <input> real, así que lo que se cuida aquí
 * es que siga comportándose como una casilla de verdad: accesible por su
 * etiqueta, marcable, y con el estado "algunas" de la cabecera de una lista.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import Casilla from '../Casilla';

describe('Casilla de selección', () => {
  it('se encuentra por su etiqueta y arranca desmarcada', () => {
    render(<Casilla label="Seleccionar F001" checked={false} onChange={() => {}} />);
    const casilla = screen.getByLabelText('Seleccionar F001') as HTMLInputElement;
    expect(casilla.type).toBe('checkbox');
    expect(casilla.checked).toBe(false);
    expect(casilla.indeterminate).toBe(false);
  });

  it('avisa cuando la marcan y cuando la desmarcan', () => {
    const onChange = jest.fn();
    const { rerender } = render(<Casilla label="Marcar" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Marcar'));
    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender(<Casilla label="Marcar" checked onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Marcar'));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('con selección parcial queda en "algunas", no marcada', () => {
    render(<Casilla label="Todas" checked={false} algunas onChange={() => {}} />);
    const casilla = screen.getByLabelText('Todas') as HTMLInputElement;
    expect(casilla.indeterminate).toBe(true);
    expect(casilla.checked).toBe(false);
  });

  it('si están todas marcadas manda el check, no el guion', () => {
    render(<Casilla label="Todas" checked algunas onChange={() => {}} />);
    const casilla = screen.getByLabelText('Todas') as HTMLInputElement;
    expect(casilla.checked).toBe(true);
    expect(casilla.indeterminate).toBe(false);
  });

  // Quien impide el clic en una casilla deshabilitada es el navegador, no este
  // componente (jsdom sí dispara el evento, hasta en un <input> nativo). Lo que
  // corresponde verificar aquí es que el atributo llegue al input real.
  it('deshabilitada marca el input como tal', () => {
    render(<Casilla label="Bloqueada" checked={false} disabled onChange={() => {}} />);
    expect(screen.getByLabelText('Bloqueada')).toBeDisabled();
  });
});
