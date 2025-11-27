# Instrucciones de Despliegue - Terms and Conditions

## Cambios Realizados

Se ha implementado un sistema completo de aceptación de Términos y Condiciones y Política de Cookies:

### Archivos Modificados

- ✅ `prisma/schema.prisma` - Agregados campos de aceptación
- ✅ `app/auth/register/page.tsx` - Checkboxes de aceptación
- ✅ `app/api/auth/save-user/route.ts` - Validación y almacenamiento
- ✅ `components/UserSidebar.tsx` - Enlaces en sidebar

### Archivos Nuevos

- ✅ `components/TermsAndConditions.tsx` - Componente de términos
- ✅ `components/CookiePolicy.tsx` - Componente de cookies

### Estado de Git

- ✅ Commit creado: `feat: Add Terms and Conditions and Cookie Policy acceptance system`
- ✅ Push completado a `origin/master`

---

## Pasos para Aplicar en la Base de Datos

### Opción 1: Migración de Desarrollo (Recomendado)

Si tienes acceso a la base de datos de desarrollo:

```bash
npx prisma migrate dev --name add_terms_acceptance_fields
```

Este comando:

1. Crea una nueva migración SQL
2. Aplica los cambios a la base de datos
3. Regenera el cliente de Prisma

### Opción 2: Push Directo (Desarrollo Rápido)

Para aplicar cambios sin crear archivos de migración:

```bash
npx prisma db push
```

Este comando aplica los cambios directamente sin crear archivos de migración.

### Opción 3: Migración de Producción

Para aplicar en producción (después de hacer push a Git):

```bash
npx prisma migrate deploy
```

Este comando aplica todas las migraciones pendientes en producción.

---

## Cambios en la Base de Datos

Se agregarán dos nuevos campos a la tabla `User`:

```sql
ALTER TABLE "User"
ADD COLUMN "termsAcceptedAt" TIMESTAMP,
ADD COLUMN "cookiePolicyAcceptedAt" TIMESTAMP;
```

Estos campos son **opcionales** (nullable), por lo que:

- ✅ No afectará a usuarios existentes
- ✅ Los usuarios nuevos tendrán estos campos poblados
- ✅ Es una migración segura y reversible

---

## Verificación Post-Despliegue

Después de aplicar la migración, verifica:

### 1. Registro de Nuevos Usuarios

```bash
# Intenta registrar un nuevo usuario
# Verifica que:
- Los checkboxes aparezcan en /auth/register
- No se pueda enviar el formulario sin aceptar ambos
- Los modales se abran correctamente
```

### 2. Sidebar

```bash
# Inicia sesión con un usuario
# Verifica que:
- El sidebar muestre la sección "Legal"
- Los enlaces abran los modales correctamente
```

### 3. Base de Datos

```sql
-- Verifica que los nuevos campos existan
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User'
AND column_name IN ('termsAcceptedAt', 'cookiePolicyAcceptedAt');

-- Verifica que los nuevos usuarios tengan timestamps
SELECT id, email, "termsAcceptedAt", "cookiePolicyAcceptedAt"
FROM "User"
ORDER BY id DESC
LIMIT 5;
```

---

## Rollback (Si es necesario)

Si necesitas revertir los cambios:

### 1. Revertir Git

```bash
git revert 7c2ddc5
git push origin master
```

### 2. Revertir Base de Datos

```sql
ALTER TABLE "User"
DROP COLUMN "termsAcceptedAt",
DROP COLUMN "cookiePolicyAcceptedAt";
```

### 3. Regenerar Cliente Prisma

```bash
npx prisma generate
```

---

## Notas Importantes

> **⚠️ IMPORTANTE - Revisión Legal**
>
> Los Términos y Condiciones y la Política de Cookies contienen texto genérico.
> Antes de usar en producción, deben ser revisados y personalizados por un
> profesional legal para cumplir con las leyes aplicables en tu jurisdicción.

> **📝 Nota sobre Usuarios Existentes**
>
> Los usuarios existentes en la base de datos tendrán estos campos como `null`.
> Esto es correcto porque no aceptaron los términos al momento de registro.
> Si deseas que acepten los nuevos términos, considera implementar un flujo
> de re-aceptación en el próximo login.

> **🔄 Cliente Prisma**
>
> El cliente de Prisma ya fue regenerado con `npx prisma generate`.
> Los tipos TypeScript están actualizados y el código compilará correctamente.

---

## Soporte

Si encuentras algún problema durante el despliegue:

1. Verifica que el archivo `.env` tenga la variable `DATABASE_URL` correcta
2. Asegúrate de tener conexión a la base de datos
3. Revisa los logs de Prisma para errores específicos
4. Verifica que la versión de Prisma sea compatible (actualmente 6.19.0)

---

## Resumen

✅ **Código**: Subido a Git (commit 7c2ddc5)  
⏳ **Base de Datos**: Pendiente de migración (ejecutar comando manualmente)  
✅ **Cliente Prisma**: Generado y actualizado  
✅ **TypeScript**: Sin errores de compilación  
⚠️ **Legal**: Requiere revisión profesional antes de producción

**Siguiente paso**: Ejecutar `npx prisma migrate dev` cuando tengas acceso a la base de datos.
