/**
 * Recompra por producto (2026-10-21): antes el aviso salía a los 25 días para
 * todo. Cada producto dice ahora a los cuántos días se acaba, o que no se
 * recompra.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/utils/apiClient', () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock('@/zustand/alert', () => ({ __esModule: true, default: () => ({ alert: jest.fn() }) }));
jest.mock('@iconify/react', () => ({ Icon: () => null }));

import { ProductDisponibilidadIa } from '../ProductDisponibilidadIa';
import { diasRecompraParaGuardar } from '../../diasRecompra';

const vmFalso = (over: Record<string, unknown> = {}) => {
  const cambios: { name: string; value: string }[] = [];
  return {
    cambios,
    vm: {
      formValues: { productoId: 12, disponibilidad: 'INMEDIATA', prioridadVenta: 0, ...over },
      handleChange: (e: { target: { name: string; value: string } }) => cambios.push({ ...e.target }),
      isEdit: true,
    } as never,
  };
};

describe('recordarle que reponga', () => {
  it('vacío explica que usa lo de la empresa', () => {
    const { vm } = vmFalso({ diasRecompra: null });
    render(<ProductDisponibilidadIa vm={vm} />);
    expect(screen.getByTestId('dias-recompra')).toHaveValue(null);
    expect(screen.getByText(/25 días si no lo cambiaste/)).toBeInTheDocument();
  });

  it('muestra los días guardados y qué va a pasar', () => {
    const { vm } = vmFalso({ diasRecompra: 30 });
    render(<ProductDisponibilidadIa vm={vm} />);
    expect(screen.getByTestId('dias-recompra')).toHaveValue(30);
    expect(screen.getByText(/le escribe 30 días después/)).toBeInTheDocument();
  });

  it('escribir días los manda al formulario, dentro de 1-365', () => {
    const { vm, cambios } = vmFalso();
    render(<ProductDisponibilidadIa vm={vm} />);
    fireEvent.change(screen.getByTestId('dias-recompra'), { target: { value: '45' } });
    fireEvent.change(screen.getByTestId('dias-recompra'), { target: { value: '900' } });
    expect(cambios).toEqual([
      { name: 'diasRecompra', value: '45' },
      { name: 'diasRecompra', value: '365' },
    ]);
  });

  it('"no se recompra" guarda 0 y apaga el número', () => {
    const { vm, cambios } = vmFalso();
    render(<ProductDisponibilidadIa vm={vm} />);
    fireEvent.click(screen.getByTestId('no-se-recompra'));
    expect(cambios).toEqual([{ name: 'diasRecompra', value: '0' }]);

    const { vm: vm0 } = vmFalso({ diasRecompra: 0 });
    render(<ProductDisponibilidadIa vm={vm0} />);
    expect(screen.getAllByTestId('dias-recompra')[1]).toBeDisabled();
    expect(screen.getByText(/No se le manda recordatorio/)).toBeInTheDocument();
  });
});

describe('lo que se manda al guardar', () => {
  it('vacío es null (vuelve a lo de la empresa), 0 es "no se recompra"', () => {
    expect(diasRecompraParaGuardar('')).toBeNull();
    // Sin cargar todavía: no se toca lo guardado.
    expect(diasRecompraParaGuardar(undefined)).toBeUndefined();
    expect(diasRecompraParaGuardar(null)).toBeNull();
    expect(diasRecompraParaGuardar('0')).toBe(0);
    expect(diasRecompraParaGuardar('30')).toBe(30);
    expect(diasRecompraParaGuardar(30)).toBe(30);
    expect(diasRecompraParaGuardar('abc')).toBeNull();
  });
});
