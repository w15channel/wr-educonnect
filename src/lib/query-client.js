import { QueryClient } from '@tanstack/react-query';

/**
 * Cache compartilhado do site.
 * - staleTime alto: cada tela reaproveita o que já foi carregado, em vez de
 *   refazer a mesma consulta ao servidor a cada navegação (era a causa das
 *   listas aparecendo vazias até o aluno sair e voltar).
 * - retry com espera progressiva: quando o servidor recusa por excesso de
 *   pedidos, a consulta tenta de novo sozinha em vez de exibir vazio.
 * - placeholderData: mantém o conteúdo anterior na tela enquanto atualiza.
 */
export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			staleTime: 60000,
			gcTime: 15 * 60000,
			retry: 3,
			retryDelay: (attempt) => Math.min(800 * 2 ** attempt, 8000),
			placeholderData: (previous) => previous,
		},
	},
});