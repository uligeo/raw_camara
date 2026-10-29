import type { EditParams } from '../types'
import { filmById } from '../films/catalog'
import { loadTexture } from '../films/lut'
import { focalTransform } from '../optics/focal'
import type { Pass, Pipeline } from './pipeline'
import { lightFragment } from './shaders/light.frag'
import { filmFragment } from './shaders/film.frag'
import { edgeBlurFragment, geometryFragment, lensFragment } from './shaders/optics.frag'
import { grainFragment } from './shaders/grain.frag'
import { halationFragment, overlayFragment } from './shaders/effects.frag'

const OVERLAYS = {
  lightLeak: 'textures/overlays/leak-warm.png',
  dust: 'textures/overlays/dust.png',
  flare: 'textures/overlays/flare.png',
}

const unit = (value: number) => value / 100

function hasLight(params: EditParams): boolean {
  return Object.values(params.light).some((value) => value !== 0) || params.film.develop !== 0
}

export async function buildPasses(
  pipeline: Pipeline,
  gl: WebGLRenderingContext,
  params: EditParams,
  options: { live?: boolean } = {},
): Promise<Pass[]> {
  const passes: Pass[] = []
  const film = filmById(params.film.filmId)
  const { zoom, barrel } = focalTransform(params.optics.focalMm)

  if (!options.live && (zoom !== 1 || barrel !== 0)) {
    passes.push({ program: pipeline.program(geometryFragment), uniforms: { uZoom: zoom, uBarrel: barrel } })
  }

  if (hasLight(params)) {
    const develop = params.film.develop
    passes.push({
      program: pipeline.program(lightFragment),
      uniforms: {
        uExposure: unit(params.light.exposure) + develop * 0.18,
        uContrast: unit(params.light.contrast) + develop * 0.12,
        uHighlights: unit(params.light.highlights),
        uShadows: unit(params.light.shadows),
        uTemperature: unit(params.light.temperature),
        uTint: unit(params.light.tint),
        uSaturation: unit(params.light.saturation),
      },
    })
  }

  if (params.film.intensity > 0) {
    const { recipe } = film
    passes.push({
      program: pipeline.program(filmFragment),
      uniforms: {
        uLift: recipe.lift,
        uGamma: recipe.gamma,
        uGain: recipe.gain,
        uShadowTint: recipe.shadowTint,
        uHighlightTint: recipe.highlightTint,
        uSat: recipe.sat,
        uFilmContrast: recipe.contrast,
        uFade: recipe.fade,
        uMono: recipe.mono,
        uIntensity: unit(params.film.intensity),
      },
    })
  }

  if (options.live) return passes

  if (params.effects.halation > 0) {
    passes.push({
      program: pipeline.program(halationFragment),
      uniforms: { uAmount: unit(params.effects.halation), uThreshold: 0.72 },
    })
  }

  if (params.optics.vignette > 0 || params.optics.chromatic > 0) {
    passes.push({
      program: pipeline.program(lensFragment),
      uniforms: {
        uVignette: unit(params.optics.vignette),
        uChromatic: unit(params.optics.chromatic),
      },
    })
  }

  if (params.optics.edgeBlur > 0) {
    passes.push({
      program: pipeline.program(edgeBlurFragment),
      uniforms: { uAmount: unit(params.optics.edgeBlur) },
    })
  }

  if (params.film.grainAmount > 0 || params.film.texture > 0) {
    passes.push({
      program: pipeline.program(grainFragment),
      uniforms: {
        uAmount: unit(params.film.grainAmount),
        uSize: unit(params.film.grainSize),
        uTexture: unit(params.film.texture),
        uSeed: 11,
      },
    })
  }

  const overlays: Array<[number, string, number]> = [
    [params.effects.lightLeak, OVERLAYS.lightLeak, 0],
    [params.effects.flare, OVERLAYS.flare, 0],
    [params.effects.dust, OVERLAYS.dust, 0],
  ]
  for (const [amount, url, blend] of overlays) {
    if (amount <= 0) continue
    passes.push({
      program: pipeline.program(overlayFragment),
      uniforms: { uOverlay: await loadTexture(gl, url), uAmount: unit(amount), uBlend: blend },
    })
  }

  return passes
}
