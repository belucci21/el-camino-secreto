# Recepción de asistencia y canciones

Destino existente: https://docs.google.com/spreadsheets/d/1LNQX9coVc9r-EzbsMKlqDcyFlKqYCKBLi-RL4KtV55Y/edit

- `INVITADOS` (primera pestaña, id 0): ID, fecha, nombre, asistencia, acompañantes, alergias, menú y mensaje.
- `MUSICA` (segunda pestaña, id 712767253): ID, fecha y canción.

Las cabeceras se crean solo si la pestaña está vacía. Si ya hay cabeceras distintas, el script rechaza el envío sin sobrescribirlas. No cambia permisos ni crea otro documento.

## Activación pendiente de autorización del propietario

1. En esa hoja: Extensiones → Apps Script. Copiar `Code.gs`.
2. Crear una cadena aleatoria de al menos 32 caracteres. Guardarla en Propiedades del script con el nombre `JOURNEY_SECRET`. No incluirla en Git ni enviarla por chat.
3. Implementar como aplicación web, ejecutada por el propietario, accesible a «Cualquier persona». Esto expone un receptor, **no** la hoja: cada solicitud exige la clave privada del servidor. El propietario debe revisar y autorizar el permiso de escritura solicitado por Google.
   - La autorización se realiza en tu cuenta de Google, no en este chat. Google puede describir el permiso como acceso a tus hojas de cálculo; el código preparado fija el ID de esta hoja y solo escribe en `INVITADOS` y `MUSICA`. Si no quieres conceder ese permiso, no lo autorices: podemos valorar otra conexión.
   - No hace falta cambiar «Compartir» de la hoja ni publicar sus datos. No deben solicitarse permisos de Gmail o Calendar para este script.
4. En el entorno del contenedor `camino`, configurar:
   - `JOURNEY_SHEETS_ENDPOINT`: URL `https://script.google.com/macros/s/.../exec` de la implementación.
   - `JOURNEY_SHEETS_SECRET`: la misma clave que `JOURNEY_SECRET`.
5. Reiniciar/actualizar el contenedor y hacer un envío de prueba autorizado a cada pestaña. Verificar las filas en Sheets antes de dar la integración por activa.

El navegador llama a `/api/responses` en su propio dominio. Solo el servidor conoce la URL y la clave del receptor. No usar `NEXT_PUBLIC_` para ninguna de estas variables. Google redirige la respuesta de ContentService; la petición servidor-servidor permite leer la confirmación sin recurrir a `no-cors`.

La interfaz muestra éxito solo después de recibir `{ok:true,id}` del receptor. Si falta configuración, el servidor devuelve 503; si falla el guardado, la interfaz conserva el formulario y permite reintentar. Un identificador estable evita duplicar el registro al reintentar y permite editar la misma respuesta. No se transmiten formularios por WhatsApp/correo como segundo paso.

No se han realizado envíos reales mientras no se autorice y configure el receptor. No hacer públicos los datos de invitados.

Documentación: https://developers.google.com/apps-script/guides/web
