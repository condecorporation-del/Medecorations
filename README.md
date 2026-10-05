# ME Cabo — catálogo de decoraciones 2026

Micrositio en inglés para explorar el menú extraído del PDF, preparar una celebración y contactar al equipo. Diseño en tonos arena y verde, fotografías protagonistas, entradas al hacer scroll, detalles animados y carrito lateral en dos pasos. Incluye catálogo JSON, solicitudes con Supabase y correo de Resend, checkout de Stripe y webhook de pago.

El carrito conserva productos, cantidades y variantes al recargar. Los datos personales del formulario no se guardan en localStorage. Las animaciones respetan la preferencia de movimiento reducido del dispositivo.

Las entregas se realizan exclusivamente en el hotel ME Cabo. El formulario solicita nombre y apellido obligatorios, correo y fecha del evento. El servidor fija el hotel y transmite el nombre del huésped a los pedidos, Stripe, los correos y el mensaje de WhatsApp. Si la base de datos ya existe, vuelve a ejecutar `schema.sql` para agregar `customer_first_name` y `customer_last_name`; los pedidos anteriores se conservan.

## Análisis del menú fuente

El catálogo está en `src/lib/catalog.json`; cada producto conserva nombre bilingüe cuando el PDF lo publica, precio USD, descripción, elementos, categoría, imagen local y página de origen. El menú incluye 15 opciones: 10 florales, 2 bouquets de globos y 3 decoraciones de celebración. En página 9 el PDF repite “30 globos con helio + 20 de piso” y muestra $330 para Bride To Be; se conserva tal cual sin reinterpretar. En página 6 el banner de aniversario y 6 globos corazón aparece a $160, y la bolsa de pétalos a $75. Los precios se expresan como estimados; disponibilidad de flores y colores puede cambiar.

## Requisitos

- Node.js 20.9 o superior
- Cuenta de Supabase, Resend y Stripe solo si se activan correo, persistencia o pagos

## Instalación local

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Para abrir la vista en el puerto usado durante el desarrollo: `npm run dev -- -p 3001`, con `NEXT_PUBLIC_SITE_URL=http://localhost:3001`. Desarrollo usa `.next-dev` y producción `.next`, para evitar que una compilación sobrescriba los estilos del servidor local.

Abre http://localhost:3000. Configura `NEXT_PUBLIC_WHATSAPP_NUMBER` en formato internacional, solo dígitos, para que los botones abran el chat comercial. Sin número, el flujo WhatsApp dirige a la sección de contacto, en vez de generar un enlace roto.

## Variables de entorno

Copia `.env.example` a `.env.local` y configura:

- `NEXT_PUBLIC_SITE_URL`: URL pública; en local `http://localhost:3000`.
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: número Business, ejemplo `526241234567`.
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: Supabase. La clave de servicio vive solo en el servidor.
- `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`: Resend con dominio remitente verificado.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: Stripe en modo test o producción.

Sin Supabase/Resend, cotizar por WhatsApp sigue disponible. La solicitud por correo y el pago muestran un mensaje de configuración pendiente. No agregues secretos `STRIPE_*`, `RESEND_API_KEY` ni `SUPABASE_SERVICE_ROLE_KEY` como variables `NEXT_PUBLIC_*`.

## Base de datos

En Supabase SQL Editor ejecuta `schema.sql`, también si ya habías creado la tabla con la versión anterior. Incluye la migración para agrupar solicitudes de varios productos y almacenar variantes e identificadores de cada línea de Stripe. RLS está activa y no hay políticas públicas; solo la API de servidor usa la service role key.

## Stripe y correo

1. En Stripe configura endpoint `https://TU-DOMINIO/api/webhooks/stripe` para `checkout.session.completed` y `checkout.session.async_payment_succeeded`; guarda el signing secret en `STRIPE_WEBHOOK_SECRET`.
2. Configura sitio y claves Stripe; el checkout cobra el precio completo publicado, en USD. Los pagos en línea no tienen recargo PayPal.
3. Verifica el dominio de `EMAIL_FROM` en Resend. Al guardar solicitud (o recibir webhook pagado), se envía confirmación al cliente y aviso al administrador.
4. Stripe Checkout es un pago inmediato del total; valida disponibilidad con el negocio y acuerda primero si necesitas cobrar solo un anticipo. No se modeló un anticipo porque el menú no publica importes ni porcentajes de apartado.

El servidor calcula los precios desde el catálogo, valida fechas y variantes y genera una línea de pago por selección. El webhook verifica firma y estado pagado, recupera todas las líneas y evita duplicarlas al reintentar. La página de retorno consulta Stripe antes de mostrar un pago confirmado. Los correos usan claves de idempotencia de Resend. No se incluye ninguna clave privada en esta entrega; cobros y notificaciones reales requieren configurar los proveedores.

Referencias: [líneas de Checkout](https://docs.stripe.com/api/checkout/sessions/line_items), [límites de metadata](https://docs.stripe.com/api/metadata).

## Despliegue rápido en Vercel

1. Sube el proyecto a un repositorio Git privado y conéctalo en Vercel.
2. Añade las variables de `.env.example` en Project Settings → Environment Variables.
3. Ejecuta `npm run build` localmente y despliega (`vercel --prod`) o usa el flujo automático de Vercel.
4. Actualiza `NEXT_PUBLIC_SITE_URL` y la URL del webhook Stripe con el dominio final.

## Estructura

```text
public/images/                 Fotos extraídas del menú + logo proporcionado
src/app/page.tsx               Portada y catálogo
src/app/confirmacion/page.tsx  Retorno del checkout
src/app/api/orders/route.ts    Solicitud, Supabase y correos
src/app/api/checkout/route.ts  Sesión Stripe Checkout
src/app/api/webhooks/stripe/   Confirmación asíncrona del pago
src/components/Catalog.tsx     Catálogo, animaciones, detalle, carrito y formulario
src/lib/presentation.ts        Textos del catálogo en inglés
src/lib/order-input.ts         Validación y cálculo de precios en servidor
src/lib/catalog.json           Datos estructurados del menú
src/lib/email.ts               Confirmación cliente + aviso admin
schema.sql                     Tabla ligera de órdenes
.env.example                   Nombres de variables requeridas
```

## Decisiones y pendientes de negocio

- Se usa Next.js App Router con CSS ligero y catálogo local; no hay dependencia del backend para explorar el menú.
- WhatsApp lleva mensaje con nombre y apellido del huésped, selección, fecha, hotel ME Cabo, cantidad, notas y total estimado.
- Aclarar con ME Cabo la línea de globos repetida en Bride To Be y si el banner/guirnalda tiene variantes con cargos diferentes antes de publicar cobros.
- Agregar teléfono WhatsApp real, dominio remitente aprobado, correo administrador, claves/entornos de proveedores y validar que el pago completo sea el flujo deseado.

