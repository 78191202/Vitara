# 🌿 Vitara — AI Wellness Coach

> Tu coach de bienestar con IA. Planes personalizados diarios, seguimiento de hábitos, y coach disponible 24/7. Disponible en 8 idiomas y 135+ países.

---

## 📁 Estructura del Proyecto

```
vitara/
│
├── 🌐 FRONTEND (páginas web — subir a Vercel)
│   ├── index.html              ← Entrada principal (enruta al usuario)
│   ├── vitara-global.html      ← Landing page de ventas global
│   ├── wellness-landing.html   ← Landing page alternativa
│   ├── success.html            ← Página post-pago (confirma con Stripe)
│   ├── onboarding.html         ← Flujo de 6 pasos de personalización
│   └── dashboard.html          ← Dashboard del usuario (plan, hábitos, coach)
│
├── ⚙️ BACKEND (servidor — subir a Railway)
│   ├── server.js               ← Servidor Express + Stripe
│   ├── package.json            ← Dependencias Node.js
│   └── .env                    ← Variables de entorno (NO subir a GitHub)
│
├── ⚙️ CONFIGURACIÓN
│   ├── vercel.json             ← Configuración de rutas para Vercel
│   └── .env.example            ← Plantilla de variables de entorno
│
└── 📖 DOCUMENTACIÓN
    ├── README.md               ← Este archivo
    ├── STRIPE_SETUP.md         ← Guía detallada de Stripe
    └── guia-despliegue.html    ← Guía visual paso a paso
```

---

## 🚀 Guía Rápida de Lanzamiento

### Paso 1 — Crea las cuentas necesarias
| Servicio | Link | Gratis |
|---|---|---|
| GitHub | github.com | ✅ |
| Vercel | vercel.com | ✅ |
| Railway | railway.app | ✅ (hasta $5/mes) |
| Stripe | stripe.com | ✅ (2.9% por venta) |

---

### Paso 2 — Sube el código a GitHub

1. Crea un repositorio nuevo en GitHub llamado `vitara`
2. Sube **todos** los archivos de este proyecto
3. ⚠️ **No subas el archivo `.env`** — contiene claves privadas

```
Archivos a subir:
✅ index.html
✅ vitara-global.html
✅ wellness-landing.html
✅ success.html
✅ onboarding.html
✅ dashboard.html
✅ server.js
✅ package.json
✅ vercel.json
✅ .env.example   (solo el ejemplo, no el .env real)
```

---

### Paso 3 — Configura Stripe

1. Ve a [dashboard.stripe.com](https://dashboard.stripe.com)
2. Crea dos productos:
   - **Vitara Pro** → $9.00/mes (recurring)
   - **Vitara Annual** → $72.00/año (recurring)
3. Copia los **Price IDs** (`price_xxx...`) de cada producto
4. Ve a **Developers → API Keys** y copia tu Secret Key y Publishable Key

---

### Paso 4 — Despliega el Backend en Railway

1. Ve a [railway.app](https://railway.app) → Login with GitHub
2. **New Project → Deploy from GitHub repo** → selecciona `vitara`
3. En tu servicio → pestaña **Variables** → agrega:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ANNUAL=price_...
YOUR_DOMAIN=https://vitara.vercel.app
```

4. En **Settings → Domains** → clic en **"Generate Domain"**
5. Copia tu URL: `https://vitara-xxx.up.railway.app`

---

### Paso 5 — Despliega el Frontend en Vercel

1. Ve a [vercel.com](https://vercel.com) → Login with GitHub
2. **Add New → Project** → selecciona `vitara`
3. Clic en **Deploy** (sin cambiar nada)
4. Tu URL: `https://vitara.vercel.app`

---

### Paso 6 — Conecta Frontend con Backend

En cada archivo HTML que tenga esta línea:
```javascript
const SERVER = "http://localhost:4242";
```

Cámbiala por tu URL de Railway:
```javascript
const SERVER = "https://vitara-xxx.up.railway.app";
```

Archivos a actualizar:
- `vitara-global.html`
- `success.html`
- `dashboard.html`

---

### Paso 7 — Configura el Webhook de Stripe

1. En Stripe → **Developers → Webhooks → Add endpoint**
2. URL: `https://vitara-xxx.up.railway.app/webhook`
3. Eventos a seleccionar:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Copia el **Signing Secret** (`whsec_...`)
5. Agrégalo en Railway como `STRIPE_WEBHOOK_SECRET`

---

### Paso 8 — Prueba con tarjetas de prueba

| Tarjeta | Resultado |
|---|---|
| `4242 4242 4242 4242` | ✅ Pago exitoso |
| `4000 0000 0000 9995` | ❌ Tarjeta rechazada |
| `4000 0025 0000 3155` | 🔐 Requiere 3D Secure |

> Usa cualquier fecha futura (ej: `12/29`) y cualquier CVC de 3 dígitos.

---

### Paso 9 — ¡Activa el modo Live!

1. En Stripe, cambia el toggle de **Test → Live**
2. Completa la verificación de tu negocio
3. Obtén tus claves Live (`sk_live_...`, `pk_live_...`)
4. Actualiza las variables en Railway con las claves Live
5. Recrea el webhook en modo Live con la nueva URL

---

## 💰 Modelo de Negocio

| Plan | Precio | Comisión Stripe | Tu ganancia |
|---|---|---|---|
| Free | $0 | — | — |
| Pro Mensual | $9/mes | ~$0.56 | **~$8.44/mes** |
| Pro Anual | $72/año | ~$2.39 | **~$69.61/año** |

> Con 100 usuarios Pro = **~$844/mes** de ingreso recurrente.

---

## 🌍 Características Globales

- ✅ **8 idiomas**: Inglés, Español, Francés, Alemán, Portugués, Japonés, Árabe, Hindi
- ✅ **135+ países** soportados por Stripe
- ✅ **40+ monedas** con conversión automática (Stripe Adaptive Pricing)
- ✅ **75+ métodos de pago**: tarjetas, Apple Pay, Google Pay, UPI, Pix, iDEAL, y más
- ✅ **RTL support** para árabe

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | HTML, CSS, JavaScript vanilla |
| Backend | Node.js + Express |
| Pagos | Stripe (Checkout + Subscriptions + Webhooks) |
| IA | Claude (Anthropic API) |
| Hosting Frontend | Vercel |
| Hosting Backend | Railway |
| Base de datos | localStorage (MVP) → migrar a Supabase o PlanetScale |

---

## 📈 Próximos Pasos (después del lanzamiento)

- [ ] Agregar base de datos real (Supabase — gratis)
- [ ] Email de bienvenida automático (Resend — gratis hasta 3k/mes)
- [ ] App móvil (React Native o PWA)
- [ ] Panel de administración para ver todos los usuarios
- [ ] Programa de afiliados
- [ ] Integración con Apple Health / Google Fit

---

## 🆘 Soporte

¿Problemas? Revisa:
1. **`guia-despliegue.html`** — guía visual completa paso a paso
2. **`STRIPE_SETUP.md`** — guía detallada de Stripe
3. Logs de Railway (pestaña **Deployments → View Logs**)
4. Logs de Stripe (pestaña **Developers → Logs**)

---

## 📄 Licencia

MIT — puedes usar, modificar y vender este producto libremente.

---

*Construido con ❤️ y Claude AI*
