/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Agrupa classes CSS condicionais de forma limpa e otimizada.
 * Utilizado para agrupar dinamicamente as classes utilitárias do Tailwind CSS.
 */
export function cn(...classes: (string | undefined | null | boolean | Record<string, boolean>)[]) {
  const result: string[] = [];

  classes.forEach((item) => {
    if (!item) return;
    if (typeof item === 'string') {
      result.push(item);
    } else if (typeof item === 'object') {
      Object.entries(item).forEach(([key, value]) => {
        if (value) {
          result.push(key);
        }
      });
    }
  });

  return result.join(' ');
}
