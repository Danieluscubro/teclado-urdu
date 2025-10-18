# Teclado Urdú ↔ Español

Sitio estático para escribir y dictar en urdú y español, con traducción bidireccional, micrófono (STT) y lectura por voz (TTS).

- Entrada seleccionable: Urdú → Español o Español → Urdú
- Teclado virtual urdú y transliteración (latino → urdú) en Urdú → Español
- Dictado por micrófono con Web Speech API (Urdu/Spanish)
- Lectura por voz del resultado con SpeechSynthesis (TTS)

## Demo pública
- GitHub Pages: https://danieluscubro.github.io/teclado-urdu/
- Repositorio: https://github.com/Danieluscubro/teclado-urdu

## Uso rápido
1. Selecciona la dirección en la barra superior.
2. Activa/desactiva "Traducción automática" según necesites.
3. En Urdú → Español, usa el teclado urdú o activa transliteración si escribes en latino.
4. Micrófono: elige idioma (urdú/español), pulsa "Empezar a hablar" y detén cuando quieras.
5. Voz: pulsa "Escuchar resultado" para oír la salida, y "Detener voz" para parar.

## Notas
- Requiere HTTPS para micrófono y TTS (GitHub Pages ya sirve con HTTPS).
- Si el dictado urdú devuelve roman urdu, se translitera automáticamente a urdú.
- Las APIs de traducción (MyMemory/LibreTranslate) pueden tener límites o latencia.