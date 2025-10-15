# mobile_ige2a

Configuração do Google Maps (Web)

- Defina `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` no arquivo `.env` (use `.env.example` como base).
- Instale a dependência do mapa web: `npm i @react-google-maps/api@2 --save-exact`.
- O mapa carrega apenas no client (sem SSR) e substitui o placeholder na `/home`.
- Marcadores usam `Station.latitude/longitude` e exibem tooltip com “Ver detalhes”.
- Opções ativas: `disableDefaultUI: true`, `gestureHandling: "greedy"`.