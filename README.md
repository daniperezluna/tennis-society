# Tennis Society

Aplicación web para gestionar una liga amateur de Virtua Tennis (arcade) entre compañeros: tres divisiones, calendario de liga ida y vuelta, copa eliminatoria con cabezas de serie, panel de administración con usuarios y un asistente IA opcional para redactar noticias.

## Cómo funciona la competición

### Liga

- **Tres divisiones** (Hierba, Arcilla, Dura) con su propio calendario independiente.
- **Sistema doble round-robin**: cada jugador se enfrenta dos veces contra el resto de su división, una como local y otra como visitante.
- **Formato del partido**: al mejor de 3 sets. Resultados posibles: `2-0`, `2-1`, `1-2`, `0-2`.
- **Puntuación**:
  - Victoria → 1 punto.
  - Derrota → 0 puntos.
- **Walkover (W/O)**: si un jugador no se presenta, su rival se lleva la victoria sin que cuenten los sets ni se incremente el `Jugados`. La columna de diferencia de sets queda intacta para los dos.
- **Desempates** en la clasificación (en este orden):
  1. Victorias.
  2. Diferencia de sets (sets ganados − sets perdidos).
  3. Head-to-head (quién ganó el enfrentamiento directo).
  4. Orden alfabético del nombre.

### Copa

- Eliminatoria directa, single elimination.
- **Solo participan los jugadores marcados con `COPA = Sí`** en el panel de equipos.
- El cuadro se ajusta automáticamente a la siguiente potencia de 2 (4, 8, 16, 32 o 64) según el número de inscritos.
- **Byes / cabezas de serie**:
  - Los jugadores que mejor van en la liga reciben los byes.
  - Ranking de seeding: posición 1 de cada división, luego posición 2 de cada división, etc. (D1.1, D2.1, D3.1, D1.2, D2.2, D3.2…).
  - Las posiciones de bye se distribuyen por bit-reversal: el seed 1 y el seed 2 quedan en mitades opuestas del cuadro y, en el peor de los casos, solo se cruzan en la final.
- **Avance**: el ganador de cada eliminatoria pasa automáticamente al partido siguiente. Cada `CupMatch` tiene `nextMatchId` y `nextSlot` precalculados, así el sistema sabe exactamente a qué hueco enviar al vencedor.
- **Walkover**: igual que en liga, el rival avanza sin que haya score real.
- **Edición manual**: desde admin se puede cambiar manualmente los equipos de un partido. Al hacerlo se resetea la cadena de avances posteriores que dependían de él.

## Stack

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS 4
- Prisma 7 con Postgres
- Adapter `@prisma/adapter-pg`
- Auth propia con bcrypt + sesiones en BD
- Zod para validación
- AI SDK + Gemini (opcional)

## Requisitos

- Node.js 20.x
- Postgres (local o remoto, Neon va bien)

## Instalación

```bash
npm install
```

## Variables de entorno

```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Opcional, activa el asistente IA en /admin/noticias y la frase dinámica de la home
GOOGLE_GENERATIVE_AI_API_KEY=""
```

## Preparar base de datos

```bash
npx prisma migrate dev --name init
npm run seed                          # opcional: equipos, calendarios y copa de ejemplo
```

## Crear el primer admin

Como la app no tiene auto-registro, hay que crear el primer usuario por consola:

```bash
npx tsx scripts/create-admin.ts tu@email.com tu-password "Tu Nombre"
```

A partir de ahí los demás admins se crean desde `/admin/usuarios`.

Para entornos donde solo tienes acceso SQL (como el panel de Neon o Vercel Postgres), genera el hash en local y haz el INSERT manualmente:

```bash
npx tsx scripts/hash-password.ts tu-password
```

```sql
INSERT INTO "AdminUser" (email, "passwordHash", name)
VALUES ('tu@email', '$2b$12$...', 'Tu Nombre');
```

## Desarrollo

```bash
npm run dev
```

Rutas:

- `/` — Portada con líderes de cada división, stats y últimas noticias.
- `/liga` — Clasificación y calendario por división.
- `/copa` — Cuadro de la copa en formato bracket visual.
- `/noticias` — Crónicas y avisos.
- `/admin` — Panel de gestión (requiere login).

## Panel admin

Secciones:

- **Equipos**: alta, edición, baja. Cada equipo tiene división y flag `COPA`.
- **Ligas**: ver todos los partidos agrupados por enfrentamiento (ida + vuelta juntos), filtros por jugador y estado, meter resultados con un click, regenerar calendario.
- **Copa**: sortear nueva copa, ver el bracket, meter resultados, walkovers, editar equipos de un partido manualmente.
- **Noticias**: alta, baja, asistente IA para redactar borradores en streaming.
- **Usuarios**: alta y baja de admins. No puedes borrarte a ti mismo ni dejar la BD sin admins.

## Scripts

```bash
npm run dev                              # Servidor de desarrollo
npm run build                            # prisma generate + migrate deploy + next build
npm run start                            # Servir build de producción
npm run lint                             # ESLint
npm run seed                             # Poblar BD con equipos y calendario de ejemplo
npx tsx scripts/create-admin.ts ...      # Crear admin directamente en BD
npx tsx scripts/hash-password.ts ...     # Generar hash bcrypt sin tocar BD
```

## Deploy

Build automático ejecuta `prisma generate`, aplica las migraciones con `prisma migrate deploy` y compila Next.js. Las únicas variables que necesitas en el entorno son `DATABASE_URL` y, si quieres IA, `GOOGLE_GENERATIVE_AI_API_KEY`.
