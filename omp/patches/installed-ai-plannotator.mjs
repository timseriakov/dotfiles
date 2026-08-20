export function createInstalledAiPlannotatorPatches(ctx) {
  const { replaceOnce, replaceAny, insertAfter, insertBefore } = ctx;

  function patchPiAiOpenAICompletions(content) {
    const hasExtendedSchemaHelpers = content.includes(
      "findStrictToolSchemaViolation",
    );
    const currentImports = hasExtendedSchemaHelpers
      ? [
          `import {\n\tadaptSchemaForStrict,\n\tfindStrictToolSchemaViolation,\n\tflattenExclusiveRequiredRootUnion,\n\tNO_STRICT,\n\tnormalizeSchemaForMoonshot,\n\tsanitizeSchemaForGrammar,\n\ttoolWireSchema,\n} from "../utils/schema";`,
        ]
      : [
          `import {\n\tadaptSchemaForStrict,\n\tNO_STRICT,\n\tnormalizeSchemaForMoonshot,\n\tsanitizeSchemaForGrammar,\n\ttoolWireSchema,\n} from "../utils/schema";`,
        ];
    const patchedImport = hasExtendedSchemaHelpers
      ? `import {\n\tadaptSchemaForStrict,\n\tfindStrictToolSchemaViolation,\n\tflattenExclusiveRequiredRootUnion,\n\tNO_STRICT,\n\tnormalizeSchemaForMoonshot,\n\tsanitizeSchemaForGrammar,\n\tsanitizeSchemaForOpenAIResponses,\n\ttoolWireSchema,\n} from "../utils/schema";`
      : `import {\n\tadaptSchemaForStrict,\n\tNO_STRICT,\n\tnormalizeSchemaForMoonshot,\n\tsanitizeSchemaForGrammar,\n\tsanitizeSchemaForOpenAIResponses,\n\ttoolWireSchema,\n} from "../utils/schema";`;
    let out = replaceAny(
      content,
      currentImports,
      patchedImport,
      "pi-ai openai-completions import schema sanitizer",
    ).content;
    if (
      out.includes(
        'const rejectXaiRootObjectUnion = provider === "xai" || provider === "xai-oauth";',
      )
    ) {
      out = replaceAny(
        out,
        [
          `\t\tconst baseParameters = rejectXaiRootObjectUnion\n\t\t\t? flattenExclusiveRequiredRootUnion(toolWireSchema(tool))\n\t\t\t: toolWireSchema(tool);\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
          `\t\tconst baseParameters = rejectXaiRootObjectUnion\n\t\t\t? flattenExclusiveRequiredRootUnion(sanitizeSchemaForOpenAIResponses(toolWireSchema(tool)))\n\t\t\t: sanitizeSchemaForOpenAIResponses(toolWireSchema(tool));\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
        ],
        `\t\tconst baseParameters = rejectXaiRootObjectUnion\n\t\t\t? flattenExclusiveRequiredRootUnion(sanitizeSchemaForOpenAIResponses(toolWireSchema(tool)))\n\t\t\t: sanitizeSchemaForOpenAIResponses(toolWireSchema(tool));\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
        "pi-ai openai-completions global schema sanitizer",
      ).content;
    } else {
      out = replaceAny(
        out,
        [
          `\t\tconst baseParameters = toolWireSchema(tool);\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
          `\t\tconst baseParameters = sanitizeSchemaForOpenAIResponses(toolWireSchema(tool));\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
        ],
        `\t\tconst baseParameters = sanitizeSchemaForOpenAIResponses(toolWireSchema(tool));\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
        "pi-ai openai-completions workspace schema sanitizer",
      ).content;
    }
    return out;
  }
  function patchPiAiSchemaNormalize(content) {
    let out = content;
    let r;

    r = replaceAny(
      out,
      [
        `const OPENAI_RESPONSES_SCHEMA_VALUE_KEYS = new Set([\n\t"items",`,
        `const UNSUPPORTED_OPENAI_REGEX_TOKENS = /\\(\\?[=!<]/;\n\nconst OPENAI_RESPONSES_SCHEMA_VALUE_KEYS = new Set([\n\t"items",`,
      ],
      `const UNSUPPORTED_OPENAI_REGEX_TOKENS = /\\(\\?[=!<]/;\n\nconst OPENAI_RESPONSES_SCHEMA_VALUE_KEYS = new Set([\n\t"items",`,
      "pi-ai openai schema unsupported regex constant",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\t\tconst child = value[key];\n\t\tlet next: unknown = child;`,
        `\t\tif (key === "pattern" && typeof value.pattern === "string" && UNSUPPORTED_OPENAI_REGEX_TOKENS.test(value.pattern)) {\n\t\t\tchanged = true;\n\t\t\tcontinue;\n\t\t}\n\n\t\tconst child = value[key];\n\t\tlet next: unknown = child;`,
      ],
      `\t\tif (key === "pattern" && typeof value.pattern === "string" && UNSUPPORTED_OPENAI_REGEX_TOKENS.test(value.pattern)) {\n\t\t\tchanged = true;\n\t\t\tcontinue;\n\t\t}\n\n\t\tconst child = value[key];\n\t\tlet next: unknown = child;`,
      "pi-ai openai schema strip lookaround patterns",
    );
    out = r.content;

    return out;
  }

  function patchPiAiTypes(content) {
    const current = `export function serviceTierFamily(model: ServiceTierModel): ServiceTierFamily | undefined {
	const provider = model.provider;
	if (provider === "openrouter") {`;
    const previousLunaOnly = `export function serviceTierFamily(model: ServiceTierModel): ServiceTierFamily | undefined {
	if (model.provider === "omniroute" && model.id === "cx/gpt-5.6-luna") return "openai";
	const provider = model.provider;
	if (provider === "openrouter") {`;
    const patched = `export function serviceTierFamily(model: ServiceTierModel): ServiceTierFamily | undefined {
	if (model.provider === "omniroute") return model.id === "cx/gpt-5.6-luna" ? "openai" : undefined;
	const provider = model.provider;
	if (provider === "openrouter") {`;
    return replaceAny(
      content,
      [current, previousLunaOnly, patched],
      patched,
      "pi-ai Luna-only service tier family",
    ).content;
  }

  function patchModelControlsLunaPriority(content) {
    const current = `		if (!model) return undefined;
		return resolveModelServiceTier(this.#serviceTierByFamily, model);`;
    const patched = `		if (!model) return undefined;
		if (model.provider === "omniroute" && model.id === "cx/gpt-5.6-luna") return "priority";
		return resolveModelServiceTier(this.#serviceTierByFamily, model);`;
    return replaceAny(
      content,
      [current, patched],
      patched,
      "Luna always uses priority service tier",
    ).content;
  }

  function patchModelRegistryCatalog(content) {
    let out = content;
    let r;

    // OpenRouter retired its free DeepSeek tier: the bundled catalog still lists
    // `deepseek/deepseek-v4-flash:free`, which 404s on every call. Filter it at
    // the catalog-load boundary (bundled models) AND at the final registry
    // composition (covers the 24h model cache merge, which also carries it).
    r = replaceAny(
      out,
      [
        `\t\t\tconst models = getBundledModels(provider as Parameters<typeof getBundledModels>[0]) as Model<Api>[];`,
      ],
      `\t\t\tlet models = getBundledModels(provider as Parameters<typeof getBundledModels>[0]) as Model<Api>[];\n\t\t\t// OpenRouter no longer serves deepseek/deepseek-v4-flash:free (404).\n\t\t\tif (provider === "openrouter") {\n\t\t\t\tmodels = models.filter(m => m.id !== "deepseek/deepseek-v4-flash:free");\n\t\t\t}`,
      "drop retired openrouter :free catalog models",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\t\tconst withModelOverrides = this.#applyModelOverrides(collapseBuiltModelVariants(combined), this.#modelOverrides);\n\t\treturn this.#applyLlamaCppModelFixups(this.#applyRuntimeProviderOverrides(withModelOverrides));\n\t}`,
      ],
      `\t\tconst withModelOverrides = this.#applyModelOverrides(collapseBuiltModelVariants(combined), this.#modelOverrides);\n\t\t// Drop the stale bundled deepseek/deepseek-v4-flash:free model from the\n\t\t// final composition (the 24h model cache merge also carries it).\n\t\tconst pruned = withModelOverrides.filter(\n\t\t\tmodel => !(model.provider === "openrouter" && model.id === "deepseek/deepseek-v4-flash:free"),\n\t\t);\n\t\treturn this.#applyLlamaCppModelFixups(this.#applyRuntimeProviderOverrides(pruned));\n\t}`,
      "drop retired openrouter :free from composed registry",
    );
    out = r.content;

    // Every model-merge path (static compose, 24h model cache, discovery refresh)
    // funnels through this helper, so prune the retired :free entry here as the
    // single choke point for paths that rebuild the snapshot outside compose.
    r = replaceAny(
      out,
      [
        `\t#mergeResolvedModels(baseModels: Model<Api>[], replacementModels: Model<Api>[]): Model<Api>[] {\n\t\treturn mergeByModelKey(baseModels, replacementModels, (existing, replacementModel) => {\n\t\t\tif (!existing) return replacementModel;\n\t\t\tconst supportsTools = replacementModel.supportsTools ?? existing.supportsTools;\n\t\t\treturn {\n\t\t\t\t...replacementModel,\n\t\t\t\tcontextWindow: replacementModel.contextWindow ?? existing.contextWindow,\n\t\t\t\tmaxTokens: replacementModel.maxTokens ?? existing.maxTokens,\n\t\t\t\tomitMaxOutputTokens: replacementModel.omitMaxOutputTokens ?? existing.omitMaxOutputTokens,\n\t\t\t\t...(supportsTools !== undefined ? { supportsTools } : {}),\n\t\t\t};\n\t\t});\n\t}`,
      ],
      `\t#mergeResolvedModels(baseModels: Model<Api>[], replacementModels: Model<Api>[]): Model<Api>[] {\n\t\t// OpenRouter retired its free DeepSeek tier; drop the stale bundled\n\t\t// deepseek/deepseek-v4-flash:free entry from every merge path.\n\t\tconst merged = mergeByModelKey(baseModels, replacementModels, (existing, replacementModel) => {\n\t\t\tif (!existing) return replacementModel;\n\t\t\tconst supportsTools = replacementModel.supportsTools ?? existing.supportsTools;\n\t\t\treturn {\n\t\t\t\t...replacementModel,\n\t\t\t\tcontextWindow: replacementModel.contextWindow ?? existing.contextWindow,\n\t\t\t\tmaxTokens: replacementModel.maxTokens ?? existing.maxTokens,\n\t\t\t\tomitMaxOutputTokens: replacementModel.omitMaxOutputTokens ?? existing.omitMaxOutputTokens,\n\t\t\t\t...(supportsTools !== undefined ? { supportsTools } : {}),\n\t\t\t};\n\t\t});\n\t\treturn merged.filter(model => !(model.provider === "openrouter" && model.id === "deepseek/deepseek-v4-flash:free"));\n\t}`,
      "drop retired openrouter :free from every model merge",
    );
    out = r.content;

    return out;
  }

  function patchPlannotatorBrowserRuntime(content) {
    let out = content;
    let r;

    if (!out.includes(`import { homedir } from "node:os";`)) {
      r = replaceOnce(
        out,
        `import { fileURLToPath } from "node:url";`,
        `import { fileURLToPath } from "node:url";
import { homedir } from "node:os";`,
        "plannotator browser homedir import",
      );
      out = r.content;
    }

    r = replaceAny(
      out,
      [
        `const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const planHtmlPath = resolve(moduleDirectory, "plannotator.html");
const reviewHtmlPath = resolve(moduleDirectory, "review-editor.html");

let browserModulePromise: Promise<PlannotatorBrowserModule> | undefined;
let planHtmlContent: string | undefined;
let reviewHtmlContent: string | undefined;

function hasReadableAsset(path: string, cachedContent: string | undefined): boolean {
	if (cachedContent) return true;
	try {
		const stats = statSync(path);
		return stats.isFile() && stats.size > 0;
	} catch {
		return false;
	}
}

function readBrowserAsset(path: string, cachedContent: string | undefined): string {
	if (cachedContent !== undefined) return cachedContent;
	try {
		return readFileSync(path, "utf-8");
	} catch {
		return "";
	}
}

/** Return whether the built plan/annotation/archive UI is available without reading it into memory. */
export function hasPlanBrowserHtml(): boolean {
	return hasReadableAsset(planHtmlPath, planHtmlContent);
}

/** Return whether the built code-review UI is available without reading it into memory. */
export function hasReviewBrowserHtml(): boolean {
	return hasReadableAsset(reviewHtmlPath, reviewHtmlContent);
}

/** Read and cache the built plan/annotation/archive UI on first use. */
export function getPlanBrowserHtml(): string {
	const content = readBrowserAsset(planHtmlPath, planHtmlContent);
	if (content) planHtmlContent = content;
	return content;
}

/** Read and cache the built code-review UI on first use. */
export function getReviewBrowserHtml(): string {
	const content = readBrowserAsset(reviewHtmlPath, reviewHtmlContent);
	if (content) reviewHtmlContent = content;
	return content;
}`,
        `const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const pluginAssetDirectory = resolve(homedir(), ".omp/plugins/node_modules/@plannotator/pi-extension");
const planHtmlPaths = [resolve(moduleDirectory, "plannotator.html"), resolve(pluginAssetDirectory, "plannotator.html")];
const reviewHtmlPaths = [resolve(moduleDirectory, "review-editor.html"), resolve(pluginAssetDirectory, "review-editor.html")];

let browserModulePromise: Promise<PlannotatorBrowserModule> | undefined;
let planHtmlContent: string | undefined;
let reviewHtmlContent: string | undefined;

function hasReadableAsset(paths: string[], cachedContent: string | undefined): boolean {
	if (cachedContent) return true;
	for (const path of paths) {
		try {
			const stats = statSync(path);
			if (stats.isFile() && stats.size > 0) return true;
		} catch {
			// try the next candidate
		}
	}
	return false;
}

function readBrowserAsset(paths: string[], cachedContent: string | undefined): string {
	if (cachedContent !== undefined) return cachedContent;
	for (const path of paths) {
		try {
			return readFileSync(path, "utf-8");
		} catch {
			// try the next candidate
		}
	}
	return "";
}

/** Return whether the built plan/annotation/archive UI is available without reading it into memory. */
export function hasPlanBrowserHtml(): boolean {
	return hasReadableAsset(planHtmlPaths, planHtmlContent);
}

/** Return whether the built code-review UI is available without reading it into memory. */
export function hasReviewBrowserHtml(): boolean {
	return hasReadableAsset(reviewHtmlPaths, reviewHtmlContent);
}

/** Read and cache the built plan/annotation/archive UI on first use. */
export function getPlanBrowserHtml(): string {
	const content = readBrowserAsset(planHtmlPaths, planHtmlContent);
	if (content) planHtmlContent = content;
	return content;
}

/** Read and cache the built code-review UI on first use. */
export function getReviewBrowserHtml(): string {
	const content = readBrowserAsset(reviewHtmlPaths, reviewHtmlContent);
	if (content) reviewHtmlContent = content;
	return content;
}`,
      ],
      `const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const pluginAssetDirectory = resolve(homedir(), ".omp/plugins/node_modules/@plannotator/pi-extension");
const planHtmlPaths = [resolve(moduleDirectory, "plannotator.html"), resolve(pluginAssetDirectory, "plannotator.html")];
const reviewHtmlPaths = [resolve(moduleDirectory, "review-editor.html"), resolve(pluginAssetDirectory, "review-editor.html")];

let browserModulePromise: Promise<PlannotatorBrowserModule> | undefined;
let planHtmlContent: string | undefined;
let reviewHtmlContent: string | undefined;

function hasReadableAsset(paths: string[], cachedContent: string | undefined): boolean {
	if (cachedContent) return true;
	for (const path of paths) {
		try {
			const stats = statSync(path);
			if (stats.isFile() && stats.size > 0) return true;
		} catch {
			// try the next candidate
		}
	}
	return false;
}

function readBrowserAsset(paths: string[], cachedContent: string | undefined): string {
	if (cachedContent !== undefined) return cachedContent;
	for (const path of paths) {
		try {
			return readFileSync(path, "utf-8");
		} catch {
			// try the next candidate
		}
	}
	return "";
}

/** Return whether the built plan/annotation/archive UI is available without reading it into memory. */
export function hasPlanBrowserHtml(): boolean {
	return hasReadableAsset(planHtmlPaths, planHtmlContent);
}

/** Return whether the built code-review UI is available without reading it into memory. */
export function hasReviewBrowserHtml(): boolean {
	return hasReadableAsset(reviewHtmlPaths, reviewHtmlContent);
}

/** Read and cache the built plan/annotation/archive UI on first use. */
export function getPlanBrowserHtml(): string {
	const content = readBrowserAsset(planHtmlPaths, planHtmlContent);
	if (content) planHtmlContent = content;
	return content;
}

/** Read and cache the built code-review UI on first use. */
export function getReviewBrowserHtml(): string {
	const content = readBrowserAsset(reviewHtmlPaths, reviewHtmlContent);
	if (content) reviewHtmlContent = content;
	return content;
}`,
      "plannotator browser asset fallback",
    );
    out = r.content;

    return out;
  }

  return {
    patchPiAiOpenAICompletions,
    patchPiAiSchemaNormalize,
    patchPiAiTypes,
    patchModelControlsLunaPriority,
    patchModelRegistryCatalog,
    patchPlannotatorBrowserRuntime,
  };
}
