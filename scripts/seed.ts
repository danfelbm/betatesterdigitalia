import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Cargar variables de entorno desde .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SeedMaterial {
  url: string
  format: 'texto' | 'imagen' | 'video'
  expected_category: 'sin_alteraciones' | 'manipulado_digitalmente' | 'generado_por_ia' | 'deepfake' | 'desinformacion_textual'
  source: string
  description: string
  subcategory?: string
}

// =============================================
// CATEGORIA 1: Material auténtico sin alteraciones
// =============================================
const sinAlteraciones: SeedMaterial[] = [
  // Textos - Medios colombianos
  { url: 'https://www.eltiempo.com/colombia/otras-ciudades/todo-lo-bueno-de-colombia-y-el-mundo-en-2025-las-noticias-positivas-que-dejaron-huella-este-ano-3516673', format: 'texto', expected_category: 'sin_alteraciones', source: 'El Tiempo', description: 'Resumen noticias positivas Colombia 2025', subcategory: 'Noticia verificada' },
  { url: 'https://www.eltiempo.com/bogota/los-hechos-que-fueron-noticia-en-bogota-en-2025-3518517', format: 'texto', expected_category: 'sin_alteraciones', source: 'El Tiempo', description: 'Balance noticioso Bogotá 2025 - Metro, política local', subcategory: 'Noticia verificada' },
  { url: 'https://www.eltiempo.com/economia/sector-financiero/como-cierra-la-economia-colombiana-en-2025-esto-revela-el-analisis-de-the-economist-3521284', format: 'texto', expected_category: 'sin_alteraciones', source: 'El Tiempo', description: 'Análisis económico Colombia con datos del Economist', subcategory: 'Análisis económico' },
  { url: 'https://www.elespectador.com/colombia-20/paz-y-memoria/hechos-de-violencia-en-2025-en-colombia-cronologia-del-conflicto-seguridad-y-todo-lo-que-paso-en-este-ano/', format: 'texto', expected_category: 'sin_alteraciones', source: 'El Espectador', description: 'Cronología conflicto armado Colombia 2025', subcategory: 'Periodismo investigativo' },
  { url: 'https://www.elespectador.com/politica/el-espectador-le-explica-el-balance-de-2025-en-colombia-y-el-mundo-noticias-hoy/', format: 'texto', expected_category: 'sin_alteraciones', source: 'El Espectador', description: 'Balance político gobierno Petro 2025', subcategory: 'Análisis político' },
  { url: 'https://www.elespectador.com/economia/asi-pinta-el-panorama-economico-en-colombia-en-2025-noticias-hoy/', format: 'texto', expected_category: 'sin_alteraciones', source: 'El Espectador', description: 'Perspectivas fiscales Colombia 2025', subcategory: 'Análisis económico' },
  { url: 'https://noticias.rcnradio.com/colombia/bogota-despierta-2025-todo-lo-que-debes-saber-sobre-horarios-y-eventos-navidenos', format: 'texto', expected_category: 'sin_alteraciones', source: 'RCN Radio', description: 'Eventos navideños Bogotá 2025', subcategory: 'Noticia verificada' },
  { url: 'https://cnnespanol.cnn.com/2025/12/30/colombia/gobierno-sube-salario-minimo-2026-efe', format: 'texto', expected_category: 'sin_alteraciones', source: 'CNN/EFE', description: 'Aumento salario mínimo Colombia 2026', subcategory: 'Noticia verificada' },
  // Textos - Fuentes regionales
  { url: 'https://www.lanacion.com.ar/politica/elecciones-argentina-2025-nid26102025/', format: 'texto', expected_category: 'sin_alteraciones', source: 'La Nación', description: 'Elecciones legislativas Argentina 2025', subcategory: 'Noticia verificada' },
  { url: 'https://www.lanacion.com.ar/politica/quien-gana-las-elecciones-argentina-2025-asi-miden-las-encuestas-para-las-legislativas-hoy-nid21102025/', format: 'texto', expected_category: 'sin_alteraciones', source: 'La Nación', description: 'Encuestas electorales Argentina 2025', subcategory: 'Análisis político' },
  { url: 'https://andina.pe/agencia/noticia-midagri-agroexportaciones-superarian-los-15000-millones-2025-1058126.aspx', format: 'texto', expected_category: 'sin_alteraciones', source: 'Andina', description: 'Agroexportaciones Perú 2025', subcategory: 'Noticia verificada' },
  { url: 'https://andina.pe/agencia/noticia-cancilleria-2025-avances-seguridad-y-consolidacion-proyeccion-internacional-1057675.aspx', format: 'texto', expected_category: 'sin_alteraciones', source: 'Andina', description: 'Política exterior peruana 2025', subcategory: 'Noticia verificada' },
  // Galerías fotográficas verificadas
  { url: 'https://www.semana.com/galerias/galeria/dia-del-trabajo-en-fotografias/611913/', format: 'imagen', expected_category: 'sin_alteraciones', source: 'Semana', description: 'Marchas 1 de mayo Colombia - fotos con créditos', subcategory: 'Galería fotográfica' },
  { url: 'https://www.semana.com/cultura/galeria/las-mejores-fotos-del-concurso-fotografia-colombia-expuesta/135794-3/', format: 'imagen', expected_category: 'sin_alteraciones', source: 'Semana', description: 'Concurso Colombia Expuesta - fotografía documental', subcategory: 'Galería fotográfica' },
  { url: 'https://www.semana.com/la-paz/galeria/muestra-fotografica-y-audiovisual-en-colombia/270716/', format: 'imagen', expected_category: 'sin_alteraciones', source: 'Semana', description: 'Muestra paz y pueblos indígenas Colombia', subcategory: 'Galería fotográfica' },
  { url: 'https://andina.pe/agencia/galeria-resumen-del-ano-2025-imagenes-28185.aspx', format: 'imagen', expected_category: 'sin_alteraciones', source: 'Andina (Perú)', description: 'Resumen fotográfico 2025 Perú', subcategory: 'Galería fotográfica' },
  // Videos de noticieros
  { url: 'https://www.noticiascaracol.com/emisiones', format: 'video', expected_category: 'sin_alteraciones', source: 'Noticias Caracol', description: 'Archivo emisiones completas noticiero', subcategory: 'Video noticiero' },
  { url: 'https://www.noticiascaracol.com/senal-en-vivo', format: 'video', expected_category: 'sin_alteraciones', source: 'Noticias Caracol', description: 'Señal en vivo noticiero', subcategory: 'Video noticiero' },
  { url: 'https://www.noticiascaracol.com/lomastrinado/reviva-el-especial-de-inocentes-de-noticias-caracol-2025-y-ria-con-las-embarradas-de-los-periodistas-ex40', format: 'video', expected_category: 'sin_alteraciones', source: 'Noticias Caracol', description: 'Especial Día de Inocentes 2025', subcategory: 'Video noticiero' },
  { url: 'https://www.noticiascaracol.com/entretenimiento/lo-que-trae-canal-caracol-para-el-2025-nuevas-producciones-lo-mejor-en-deportes-y-todo-en-noticias-rg10', format: 'video', expected_category: 'sin_alteraciones', source: 'Noticias Caracol', description: 'Contenido deportivo y actualidad 2025', subcategory: 'Video noticiero' },
]

// =============================================
// CATEGORIA 2: Contenido generado por IA
// =============================================
const generadoPorIA: SeedMaterial[] = [
  // Plataformas de generación de imágenes
  { url: 'https://www.midjourney.com/showcase/', format: 'imagen', expected_category: 'generado_por_ia', source: 'Midjourney', description: 'Galería oficial - imágenes fotorrealistas curadas', subcategory: 'Midjourney' },
  { url: 'https://openai.com/index/dall-e-3/', format: 'imagen', expected_category: 'generado_por_ia', source: 'OpenAI', description: 'Página oficial DALL-E 3 con ejemplos y prompts', subcategory: 'DALL-E' },
  { url: 'https://civitai.com/tag/photorealistic', format: 'imagen', expected_category: 'generado_por_ia', source: 'CivitAI', description: 'Modelos Stable Diffusion fotorrealistas', subcategory: 'Stable Diffusion' },
  { url: 'https://civitai.com/models', format: 'imagen', expected_category: 'generado_por_ia', source: 'CivitAI', description: 'Miles de ejemplos IA - retratos, paisajes, 3D', subcategory: 'Stable Diffusion' },
  { url: 'https://leonardo.ai/', format: 'imagen', expected_category: 'generado_por_ia', source: 'Leonardo.AI', description: 'Plataforma con PhotoReal V2 hiperrealista', subcategory: 'Leonardo.AI' },
  { url: 'https://leonardo.ai/ai-art-generator/', format: 'imagen', expected_category: 'generado_por_ia', source: 'Leonardo.AI', description: 'Generador con galería de ejemplos', subcategory: 'Leonardo.AI' },
  { url: 'https://thispersondoesnotexist.com/', format: 'imagen', expected_category: 'generado_por_ia', source: 'StyleGAN', description: 'Rostros sintéticos - nuevo rostro cada recarga', subcategory: 'GAN' },
  { url: 'https://this-person-does-not-exist.com/en', format: 'imagen', expected_category: 'generado_por_ia', source: 'StyleGAN', description: 'Versión alternativa generador de rostros', subcategory: 'GAN' },
  // Videos generados por IA
  { url: 'https://openai.com/sora/', format: 'video', expected_category: 'generado_por_ia', source: 'OpenAI Sora', description: 'Plataforma oficial generación video IA', subcategory: 'Sora' },
  { url: 'https://openai.com/index/sora/', format: 'video', expected_category: 'generado_por_ia', source: 'OpenAI Sora', description: '15+ ejemplos: Tokyo, mamuts, fiebre del oro', subcategory: 'Sora' },
  { url: 'https://github.com/vincent-hub/Awesome-OpenAI-Sora-Videos', format: 'video', expected_category: 'generado_por_ia', source: 'GitHub/Sora', description: 'Colección videos con CDN links directos', subcategory: 'Sora' },
  { url: 'https://runwayml.com/product/use-cases', format: 'video', expected_category: 'generado_por_ia', source: 'Runway ML', description: 'Casos de uso Gen-4.5 cinematográficos', subcategory: 'Runway' },
  { url: 'https://runwayml.com/research/gen-2', format: 'video', expected_category: 'generado_por_ia', source: 'Runway ML', description: 'Sistema Gen-2 texto-a-video', subcategory: 'Runway' },
  { url: 'https://runwayml.com/research/introducing-runway-gen-4', format: 'video', expected_category: 'generado_por_ia', source: 'Runway ML', description: 'Gen-4 con personajes consistentes', subcategory: 'Runway' },
  // CDN directos a videos Sora
  { url: 'https://cdn.openai.com/sora/videos/big-sur.mp4', format: 'video', expected_category: 'generado_por_ia', source: 'OpenAI Sora CDN', description: 'Escena Big Sur fotorrealista', subcategory: 'Sora MP4' },
  { url: 'https://cdn.openai.com/sora/videos/ships-in-coffee.mp4', format: 'video', expected_category: 'generado_por_ia', source: 'OpenAI Sora CDN', description: 'Barcos en taza de café', subcategory: 'Sora MP4' },
  { url: 'https://cdn.openai.com/sora/videos/tokyo-walk.mp4', format: 'video', expected_category: 'generado_por_ia', source: 'OpenAI Sora CDN', description: 'Mujer caminando en Tokyo', subcategory: 'Sora MP4' },
  { url: 'https://cdn.openai.com/sora/videos/gold-rush.mp4', format: 'video', expected_category: 'generado_por_ia', source: 'OpenAI Sora CDN', description: 'Escena fiebre del oro estilo documental', subcategory: 'Sora MP4' },
  // Datasets académicos
  { url: 'https://github.com/openai/dalle3-eval-samples', format: 'imagen', expected_category: 'generado_por_ia', source: 'OpenAI GitHub', description: '~32,000 muestras DALL-E 3 evaluación MSCOCO', subcategory: 'Dataset académico' },
  { url: 'https://huggingface.co/datasets/GenP/Synthetic_Face_Images_Academic_Dataset', format: 'imagen', expected_category: 'generado_por_ia', source: 'HuggingFace', description: '10,000 rostros sintéticos con metadatos demográficos', subcategory: 'Dataset académico' },
  { url: 'https://huggingface.co/datasets/TLeonidas/this-person-does-not-exist', format: 'imagen', expected_category: 'generado_por_ia', source: 'HuggingFace', description: '8,892 fotos de This Person Does Not Exist', subcategory: 'Dataset académico' },
  { url: 'https://huggingface.co/datasets/silent21/FaceGan', format: 'imagen', expected_category: 'generado_por_ia', source: 'HuggingFace', description: '40,000+ rostros GAN para training', subcategory: 'Dataset académico' },
  { url: 'https://github.com/SCLBD/DeepfakeBench', format: 'video', expected_category: 'generado_por_ia', source: 'GitHub', description: 'Benchmark con 9 datasets (FaceForensics++, DFDC, etc.)', subcategory: 'Dataset académico' },
  { url: 'https://coral79.github.io/CDDB_web/', format: 'imagen', expected_category: 'generado_por_ia', source: 'GitHub', description: '11 modelos deepfake (ProGAN, StyleGAN, BigGAN)', subcategory: 'Dataset académico' },
]

// =============================================
// CATEGORIA 3: Contenido manipulado digitalmente
// =============================================
const manipuladoDigitalmente: SeedMaterial[] = [
  // Colombiacheck - casos colombianos
  { url: 'https://colombiacheck.com/chequeos/la-foto-del-migrante-detenido-con-la-camiseta-de-latinos-por-trump-es-un-montaje', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Colombiacheck', description: 'Camiseta Latinos por Trump añadida digitalmente a foto de 2018', subcategory: 'Foto editada con IA' },
  { url: 'https://colombiacheck.com/chequeos/condena-alvaro-uribe-revive-fotomontaje-donde-lo-ponen-junto-pablo-escobar', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Colombiacheck', description: 'Uribe junto a Escobar - original muestra a Escobar con esposa', subcategory: 'Fotomontaje' },
  { url: 'https://colombiacheck.com/chequeos/imagen-de-maduro-arrestado-creada-con-ia-circula-en-medio-de-tensiones-entre-venezuela-y', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Colombiacheck', description: 'Maduro arrestado - creada con Grok, dedos fusionados visibles', subcategory: 'Imagen IA' },
  { url: 'https://colombiacheck.com/chequeos/foto-de-agentes-del-servicio-secreto-sonriendo-junto-donald-trump-fue-manipulada', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Colombiacheck', description: 'Agentes sonriendo tras atentado - original: semblante serio', subcategory: 'Foto manipulada' },
  { url: 'https://colombiacheck.com/chequeos/petro-difundio-foto-manipulada-con-ia-de-narcosubmarino-teledirigido-confiscado-por-la', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Colombiacheck', description: 'Petro republicó narcosubmarino falso - alterada de foto 2019', subcategory: 'IA/manipulada' },
  { url: 'https://colombiacheck.com/chequeos/manipulacion-de-afiche-de-ivan-cepeda-para-vestirlo-de-guerrillero-se-suma-ataques', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Colombiacheck', description: 'Senador Cepeda vestido de guerrillero con IA', subcategory: 'Afiche IA' },
  { url: 'https://colombiacheck.com/chequeos/petro-no-tiene-una-aprobacion-del-888-como-dice-imagen-manipulada-que-circula-en-x', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Colombiacheck', description: 'Encuesta alterada: 88.8% aprobación (real: 8.8%)', subcategory: 'Gráfico manipulado' },
  { url: 'https://colombiacheck.com/chequeos/estas-imagenes-de-maduro-siendo-resenado-en-la-policia-son-falsas-fueron-generadas-con-ia', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Colombiacheck', description: 'Maduro con uniforme carcelario naranja - IA detectada', subcategory: 'Imagen IA' },
  { url: 'https://colombiacheck.com/chequeos/circulan-fotos-falsas-creadas-con-ia-como-si-fueran-de-incendios-forestales-en-cerros-de', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Colombiacheck', description: 'Incendios falsos cerros de Bogotá - uniformes inconsistentes', subcategory: 'Fotos IA' },
  { url: 'https://colombiacheck.com/chequeos/los-politicos-que-cayeron-en-falsa-foto-de-metallica-junto-mural-del-pacto-historico', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Colombiacheck', description: 'Metallica + Pacto Histórico - Petro compartió y borró', subcategory: 'Fotomontaje' },
  { url: 'https://colombiacheck.com/chequeos/petro-republico-en-x-twitter-falsa-foto-de-un-supuesto-convoy-humanitario-egipcio-rumbo', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Colombiacheck', description: 'Convoy Gaza era camiones rusos en Ucrania 2014', subcategory: 'Contexto falso' },
  { url: 'https://colombiacheck.com/chequeos/la-foto-en-la-que-mockus-sostiene-un-cartel-que-dice-uribe-el-universo-te-odia-es-falsa', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Colombiacheck', description: 'Cartel Mockus manipulado con mensaje anti-Uribe', subcategory: 'Cartel editado' },
  { url: 'https://colombiacheck.com/chequeos/foto-de-donald-trump-con-jeffrey-epstein-y-dos-jovenes-es-falsa-y-fue-creada-con-ia', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Colombiacheck', description: 'Trump+Epstein falsa - Epstein sin piernas, manos amorfas', subcategory: 'Imagen IA' },
  { url: 'https://colombiacheck.com/chequeos/la-foto-que-desmiente-que-petro-poso-con-menor-y-ametralladora-es-falsa', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Colombiacheck', description: 'Investigación conjunta con Bellingcat sobre foto Petro', subcategory: 'Relleno generativo' },
  // Chequeado (Argentina) y otros fact-checkers
  { url: 'https://chequeado.com/ultimas-noticias/los-detalles-de-la-foto-editada-de-kate-middleton-y-algunas-herramientas-que-pueden-servir-para-detectar-casos-similares/', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Chequeado', description: 'Kate Middleton - AP, Reuters, AFP retiraron imagen', subcategory: 'Foto editada' },
  { url: 'https://chequeado.com/ultimas-noticias/fue-creada-con-inteligencia-artificial-la-imagen-viral-de-trump-con-una-andadera/', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Chequeado', description: 'Trump con andadera - 99.9% probabilidad IA', subcategory: 'Imagen IA' },
  { url: 'https://chequeado.com/ultimas-noticias/es-falsa-esta-foto-de-greta-thunberg-durante-su-arresto-la-imagen-esta-editada-en-la-zona-del-pecho/', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Chequeado', description: 'Greta Thunberg - zona del pecho editada', subcategory: 'Foto manipulada' },
  { url: 'https://chequeado.com/ultimas-noticias/no-esta-foto-de-maximo-kirchner-con-hayden-davis-no-es-real-la-imagen-esta-manipulada/', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Chequeado', description: 'Máximo Kirchner + Hayden Davis - original de 2019', subcategory: 'Foto editada' },
  { url: 'https://chequeado.com/ultimas-noticias/no-este-cartel-vial-en-ee-uu-no-muestra-la-frase-less-marx-more-milei-la-imagen-esta-manipulada/', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Chequeado', description: 'Cartel Less Marx More Milei - original Memphis 2019', subcategory: 'Cartel manipulado' },
  { url: 'https://chequeado.com/ultimas-noticias/no-los-agentes-del-servicio-secreto-no-estaban-sonriendo-mientras-protegian-a-donald-trump-del-atentado-la-imagen-fue-manipulada/', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Chequeado', description: 'Agentes sonriendo Trump - análisis InVid', subcategory: 'Foto manipulada' },
  { url: 'https://animalpolitico.com/verificacion-de-hechos/desinformacion/nicolas-maduro-uniforme-naranja-ia', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Animal Político', description: 'Maduro carcelario - Hive 97.6% probabilidad IA', subcategory: 'Imagen IA' },
  { url: 'https://animalpolitico.com/verificacion-de-hechos/desinformacion/sheinbaum-salinas-robles', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Animal Político', description: 'Sheinbaum+Salinas+Robles - tercera persona añadida', subcategory: 'Foto IA' },
  { url: 'https://www.animalpolitico.com/verificacion-de-hechos/desinformacion/amlo-delgado-foto-manipulada-retrato-calderon-fondo', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Animal Político', description: 'AMLO+Delgado - retrato Calderón añadido (original: Juárez)', subcategory: 'Foto manipulada' },
  { url: 'https://maldita.es/malditobulo/20210823/imagen-manipulada-salvador-dali-federico-garcia-lorca-abrazados-fotomontaje/', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Maldita.es', description: 'Dalí+García Lorca - original muestra a Dalí con Gala', subcategory: 'Fotomontaje' },
  { url: 'https://www.snopes.com/fact-check/trump-helping-hurricane-victims/', format: 'imagen', expected_category: 'manipulado_digitalmente', source: 'Snopes', description: 'Trump chaleco salvavidas huracán - pulgar deformado', subcategory: 'Imagen IA' },
]

// =============================================
// CATEGORIA 4: Deepfakes documentados
// =============================================
const deepfakes: SeedMaterial[] = [
  // Datasets principales de video deepfake
  { url: 'https://github.com/ondyari/FaceForensics', format: 'video', expected_category: 'deepfake', source: 'TU Munich', description: '1,000 videos + versiones manipuladas (Deepfakes, Face2Face, FaceSwap, NeuralTextures). ICCV 2019', subcategory: 'Dataset FaceForensics++' },
  { url: 'https://github.com/yuezunli/celeb-deepfakeforensics', format: 'video', expected_category: 'deepfake', source: 'U. at Buffalo', description: '5,639 deepfakes de celebridades alta calidad. CVPR 2020', subcategory: 'Dataset Celeb-DF' },
  { url: 'https://ai.meta.com/datasets/dfdc/', format: 'video', expected_category: 'deepfake', source: 'Meta/Facebook', description: '100,000+ videos de 3,426 actores. 25TB. Dataset más grande público', subcategory: 'Dataset DFDC' },
  { url: 'https://github.com/EndlessSora/DeeperForensics-1.0', format: 'video', expected_category: 'deepfake', source: 'SenseTime-NTU', description: '60,000 videos, 17.6M frames, 7 tipos perturbaciones. CVPR 2020', subcategory: 'Dataset DeeperForensics' },
  { url: 'https://github.com/OpenTAI/wild-deepfake', format: 'video', expected_category: 'deepfake', source: 'Fudan U.', description: '7,314 secuencias de deepfakes reales de internet', subcategory: 'Dataset WildDeepfake' },
  { url: 'https://github.com/DASH-Lab/FakeAVCeleb', format: 'video', expected_category: 'deepfake', source: 'Sungkyunkwan U.', description: 'Dataset multimodal audio-video sincronizado. NeurIPS 2021', subcategory: 'Dataset FakeAVCeleb' },
  // Datasets de audio deepfake
  { url: 'https://www.asvspoof.org/index2021.html', format: 'video', expected_category: 'deepfake', source: 'ASVspoof', description: 'Benchmark principal detección audio spoofing (2019, 2021, 2024)', subcategory: 'Dataset audio' },
  { url: 'https://www.kaggle.com/datasets/birdy654/deep-voice-deepfake-voice-recognition', format: 'video', expected_category: 'deepfake', source: 'Kaggle', description: 'Voice cloning de 8 figuras públicas', subcategory: 'Dataset DEEP-VOICE' },
  { url: 'https://huggingface.co/datasets/DeepFake-Audio-Rangers/Arabic_Audio_Deepfake', format: 'video', expected_category: 'deepfake', source: 'HuggingFace', description: 'Deepfake audio árabe para investigación', subcategory: 'Dataset audio' },
  // Casos virales documentados
  { url: 'https://grail.cs.washington.edu/projects/AudioToObama/', format: 'video', expected_category: 'deepfake', source: 'U. Washington', description: 'Paper seminal SIGGRAPH 2017 - audio-to-lip-sync', subcategory: 'Obama Synthesis' },
  { url: 'https://www.buzzfeednews.com/article/davidmack/obama-fake-news-jordan-peele-psa-video-buzzfeed', format: 'video', expected_category: 'deepfake', source: 'BuzzFeed', description: 'PSA 2018 con Jordan Peele sobre deepfakes', subcategory: 'Obama PSA' },
  { url: 'https://incidentdatabase.ai/cite/39/', format: 'video', expected_category: 'deepfake', source: 'AI Incident Database', description: 'Obama deepfake catalogado con evaluación de daño', subcategory: 'Caso documentado' },
  { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9453721/', format: 'texto', expected_category: 'deepfake', source: 'PMC/NIH', description: 'Deepfakes and Democracy - incluye rendición Zelensky 2022', subcategory: 'Paper académico' },
  { url: 'https://www.nature.com/articles/s41467-024-51998-z', format: 'texto', expected_category: 'deepfake', source: 'Nature Communications', description: '5 experimentos detección humana de deepfakes políticos', subcategory: 'Paper académico' },
  // Repositorios y benchmarks
  { url: 'https://github.com/Daisy-Zhang/Awesome-Deepfakes', format: 'texto', expected_category: 'deepfake', source: 'GitHub', description: 'Lista curada: 15+ datasets, herramientas, papers', subcategory: 'Repositorio' },
  { url: 'https://github.com/Daisy-Zhang/Awesome-Deepfakes-Detection', format: 'texto', expected_category: 'deepfake', source: 'GitHub', description: 'Herramientas detección CVPR, NeurIPS, ECCV', subcategory: 'Repositorio' },
  { url: 'https://github.com/selimsef/dfdc_deepfake_challenge', format: 'video', expected_category: 'deepfake', source: 'GitHub', description: 'Solución ganadora (1er lugar) Meta Challenge', subcategory: 'DFDC Winner' },
  { url: 'https://github.com/YZY-stack/DF40', format: 'video', expected_category: 'deepfake', source: 'GitHub', description: 'NeurIPS 2024: 40 técnicas (HeyGen, MidJourney, DeepFaceLab)', subcategory: 'Dataset DF40' },
  { url: 'https://cisaad.umbc.edu/data-sets/', format: 'texto', expected_category: 'deepfake', source: 'UMBC', description: 'Catálogo datasets audio deepfake UMBC', subcategory: 'Repositorio' },
]

// =============================================
// CATEGORIA 5: Desinformación textual
// =============================================
const desinformacionTextual: SeedMaterial[] = [
  // Cadenas falsas de WhatsApp - Colombia
  { url: 'https://colombiacheck.com/chequeos/cuidado-esta-cadena-de-whatsapp-es-en-realidad-una-estafa', format: 'texto', expected_category: 'desinformacion_textual', source: 'Colombiacheck', description: 'Ingreso Solidario falso - robo de datos personales', subcategory: 'Estafa phishing' },
  { url: 'https://colombiacheck.com/chequeos/es-falsa-la-entrega-de-un-bono-para-vacunados-tal-como-afirma-cadena-de-whatsapp', format: 'texto', expected_category: 'desinformacion_textual', source: 'Colombiacheck', description: 'Bono vacunados COVID falso - circuló en 5 países', subcategory: 'Estafa vacunas' },
  { url: 'https://colombiacheck.com/chequeos/cadena-de-whatsapp-que-alerta-sobre-inseguridad-no-fue-enviada-por-autoridades-colombianas', format: 'texto', expected_category: 'desinformacion_textual', source: 'Colombiacheck', description: 'Falsa alerta MinDefensa - originada Puerto Rico', subcategory: 'Suplantación' },
  { url: 'https://colombiacheck.com/chequeos/falsa-cadena-de-whatsapp-ofrece-pruebas-gratis-de-covid-19-en-cali-tras-entregar-datos', format: 'texto', expected_category: 'desinformacion_textual', source: 'Colombiacheck', description: 'Pruebas COVID gratis Cali - estafa datos', subcategory: 'Estafa COVID' },
  { url: 'https://colombiacheck.com/chequeos/reenviar-este-mensaje-no-protegera-tu-cuenta-de-whatsapp-de-supuesta-nueva-regla-para-usar', format: 'texto', expected_category: 'desinformacion_textual', source: 'Colombiacheck', description: 'Nueva regla WhatsApp fotos - circula desde 2021', subcategory: 'Bulo recurrente' },
  // Fake news electoral Colombia
  { url: 'https://colombiacheck.com/investigaciones/fraude-en-las-elecciones-las-claves-de-las-narrativas-de-desinformacion-electoral', format: 'texto', expected_category: 'desinformacion_textual', source: 'Colombiacheck', description: 'Narrativas fraude electoral 2022 - Indra, Registraduría', subcategory: 'Investigación' },
  { url: 'https://colombiacheck.com/chequeos/las-noticias-falsas-del-fraude-en-las-elecciones', format: 'texto', expected_category: 'desinformacion_textual', source: 'Colombiacheck', description: 'Falso audio suspensión segunda vuelta 2018', subcategory: 'Audio viral' },
  { url: 'https://www.newtral.es/bulos-elecciones-colombia/20220526/', format: 'texto', expected_category: 'desinformacion_textual', source: 'Newtral', description: 'Bulos 2022: pacto Satanás Petro, montaje Times Square Fico', subcategory: 'Compilación' },
  { url: 'https://maldita.es/malditobulo/20220621/desinformacion-elecciones-colombia-2022-candidatos-fraude/', format: 'texto', expected_category: 'desinformacion_textual', source: 'Maldita.es', description: 'Desinformación Colombia 2022 - entrevista Colombiacheck', subcategory: 'Análisis' },
  // Cadenas virales transfronterizas
  { url: 'https://chequeado.com/ultimas-noticias/es-falsa-la-cadena-viral-que-alerta-sobre-ladrones-que-visitan-casas-haciendose-pasar-por-el-indec-la-desinformacion-circula-en-varios-paises-desde-2024/', format: 'texto', expected_category: 'desinformacion_textual', source: 'Chequeado', description: 'Ladrones del censo - 6 países desde 2024', subcategory: 'Bulo regional' },
  { url: 'https://chequeado.com/el-explicador/la-prueba-del-iman-como-la-desinformacion-viral-cruzo-fronteras-en-la-region/', format: 'texto', expected_category: 'desinformacion_textual', source: 'Chequeado', description: 'Prueba del imán vacunas - 8 países', subcategory: 'Hoax COVID' },
  { url: 'https://chequeado.com/el-explicador/coronavirus-mira-todas-las-desinformaciones-aca/', format: 'texto', expected_category: 'desinformacion_textual', source: 'Chequeado', description: 'Desinformaciones COVID: café, dióxido de cloro, etc.', subcategory: 'Compilación' },
  { url: 'https://maldita.es/malditobulo/20250516/la-cadena-de-whatsapp-gold-y-martinelli-un-bulo-que-vuelve-con-distintas-formas-3/', format: 'texto', expected_category: 'desinformacion_textual', source: 'Maldita.es', description: 'Bulo WhatsApp Gold y virus Martinelli desde 2017', subcategory: 'WhatsApp Gold' },
  { url: 'https://maldita.es/malditobulo/20250520/whatsapp-nueva-regla-fotos-mensaje-cobro/', format: 'texto', expected_category: 'desinformacion_textual', source: 'Maldita.es', description: 'Falso cobro 0,01€ por mensaje', subcategory: 'Cobro WhatsApp' },
  { url: 'https://maldita.es/malditobulo/20221115/yuca-vitamina-b17-no-curan-cancer/', format: 'texto', expected_category: 'desinformacion_textual', source: 'Maldita.es', description: 'Yuca y vitamina B17 no curan cáncer', subcategory: 'Hoax salud' },
  { url: 'https://maldita.es/malditobulo/20200609/coronavirus-bulos-pandemia-prevenir-virus-covid-19/', format: 'texto', expected_category: 'desinformacion_textual', source: 'Maldita.es', description: '1,299 bulos COVID verificados', subcategory: 'Compilación COVID' },
  { url: 'https://chequeado.com/ultimas-noticias/los-videos-falsos-creados-con-ia-la-desinformacion-protagonista-de-2025/', format: 'texto', expected_category: 'desinformacion_textual', source: 'Chequeado', description: 'Deepfakes políticos 2025: Milei, Macri, Trump', subcategory: 'IA 2025' },
  // Sátira
  { url: 'https://actualidadpanamericana.com/', format: 'texto', expected_category: 'desinformacion_textual', source: 'Actualidad Panamericana', description: 'Principal satírico colombiano desde 2014 - Petro, Uribe han caído', subcategory: 'Sátira' },
  { url: 'https://actualidadpanamericana.com/quienes-somos/', format: 'texto', expected_category: 'desinformacion_textual', source: 'Actualidad Panamericana', description: 'Página que aclara naturaleza satírica', subcategory: 'Sátira' },
  { url: 'https://www.elmundotoday.com/', format: 'texto', expected_category: 'desinformacion_textual', source: 'El Mundo Today', description: 'Referente satírico desde 2009 - NTN24 lo difundió como real', subcategory: 'Sátira' },
  // Portales de archivo
  { url: 'https://colombiacheck.com/tags/cadena-de-whatsapp', format: 'texto', expected_category: 'desinformacion_textual', source: 'Colombiacheck', description: 'Archivo cadenas WhatsApp verificadas', subcategory: 'Portal archivo' },
  { url: 'https://colombiacheck.com/elecciones-2022', format: 'texto', expected_category: 'desinformacion_textual', source: 'Colombiacheck', description: 'Sección verificación electoral', subcategory: 'Portal archivo' },
  { url: 'https://chequeado.com/tag/falso-en-las-redes/', format: 'texto', expected_category: 'desinformacion_textual', source: 'Chequeado', description: 'Archivo Falso en las redes', subcategory: 'Portal archivo' },
  { url: 'https://chequeado.com/desinformantes/', format: 'texto', expected_category: 'desinformacion_textual', source: 'Chequeado', description: 'Investigaciones actores desinformadores', subcategory: 'Portal archivo' },
]

// =============================================
// FUNCIÓN PRINCIPAL DE SEED
// =============================================
async function seed() {
  const userId = process.argv[2]

  if (!userId) {
    console.error('Uso: npm run seed <user-id>')
    console.error('')
    console.error('Para obtener tu user-id:')
    console.error('1. Regístrate en la aplicación')
    console.error('2. Ve a Supabase Dashboard > Authentication > Users')
    console.error('3. Copia el UUID de tu usuario')
    process.exit(1)
  }

  console.log(`🚀 Iniciando seed para usuario: ${userId}`)

  // Verificar que el usuario existe y tiene estados
  const { data: userStates, error: statesError } = await supabase
    .from('analysis_states')
    .select('id')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single()

  if (statesError || !userStates) {
    console.error('❌ Error: El usuario no existe o no tiene estados de análisis.')
    console.error('   Asegúrate de registrarte primero en la aplicación.')
    process.exit(1)
  }

  const defaultStateId = userStates.id
  console.log(`✅ Estado por defecto encontrado: ${defaultStateId}`)

  // Combinar todos los materiales
  const allMaterials = [
    ...sinAlteraciones,
    ...generadoPorIA,
    ...manipuladoDigitalmente,
    ...deepfakes,
    ...desinformacionTextual,
  ]

  console.log(`📊 Total de materiales a insertar: ${allMaterials.length}`)
  console.log(`   - Sin alteraciones: ${sinAlteraciones.length}`)
  console.log(`   - Generado por IA: ${generadoPorIA.length}`)
  console.log(`   - Manipulado digitalmente: ${manipuladoDigitalmente.length}`)
  console.log(`   - Deepfakes: ${deepfakes.length}`)
  console.log(`   - Desinformación textual: ${desinformacionTextual.length}`)

  // Preparar materiales con user_id y state_id
  const materialsToInsert = allMaterials.map((m) => ({
    ...m,
    user_id: userId,
    analysis_state_id: defaultStateId,
  }))

  // Insertar en lotes de 50
  const BATCH_SIZE = 50
  let inserted = 0
  let errors = 0

  for (let i = 0; i < materialsToInsert.length; i += BATCH_SIZE) {
    const batch = materialsToInsert.slice(i, i + BATCH_SIZE)

    const { error } = await supabase
      .from('materials')
      .upsert(batch, { onConflict: 'user_id,url' })

    if (error) {
      console.error(`❌ Error en lote ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message)
      errors++
    } else {
      inserted += batch.length
      console.log(`✅ Lote ${Math.floor(i / BATCH_SIZE) + 1} insertado (${inserted}/${materialsToInsert.length})`)
    }
  }

  console.log('')
  console.log('🎉 Seed completado!')
  console.log(`   - Insertados: ${inserted}`)
  console.log(`   - Errores: ${errors}`)
}

seed().catch(console.error)
