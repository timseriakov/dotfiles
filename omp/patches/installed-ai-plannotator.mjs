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
        "const rejectRootObjectUnion = compat.rejectRootObjectUnion;",
      )
    ) {
      out = replaceAny(
        out,
        [
          `\t\tconst baseParameters = rejectRootObjectUnion\n\t\t\t? flattenExclusiveRequiredRootUnion(toolWireSchema(tool))\n\t\t\t: toolWireSchema(tool);\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
          `\t\tconst baseParameters = rejectRootObjectUnion\n\t\t\t? flattenExclusiveRequiredRootUnion(sanitizeSchemaForOpenAIResponses(toolWireSchema(tool)))\n\t\t\t: sanitizeSchemaForOpenAIResponses(toolWireSchema(tool));\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
        ],
        `\t\tconst baseParameters = rejectRootObjectUnion\n\t\t\t? flattenExclusiveRequiredRootUnion(sanitizeSchemaForOpenAIResponses(toolWireSchema(tool)))\n\t\t\t: sanitizeSchemaForOpenAIResponses(toolWireSchema(tool));\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
        "pi-ai openai-completions global schema sanitizer",
      ).content;
    } else if (
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

    out = replaceAny(
      out,
      [
        `\t\t\tif (output.stopReason === "error" && output.errorMessage === "Provider returned error finish_reason" && hasVisibleAssistantContent(output)) {
\t\t\t\toutput.stopReason = "stop";
\t\t\t\toutput.errorMessage = undefined;
\t\t\t}

\t\t\tif (output.stopReason === "stop" && output.content.some(b => b.type === "toolCall")) {
\t\t\t\toutput.stopReason = "toolUse";
\t\t\t}`,
        `\t\t\tif (output.stopReason === "stop" && output.content.some(b => b.type === "toolCall")) {
\t\t\t\toutput.stopReason = "toolUse";
\t\t\t}`,
      ],
      `			// Bare provider finish_reason:error is retried by TurnRecovery, even after partial text.
			if (output.stopReason === "stop" && output.content.some(b => b.type === "toolCall")) {
				output.stopReason = "toolUse";
			}`,
      "pi-ai openai-completions retry finish_reason errors after partial text",
    ).content;
    return out;
  }

  function patchTurnRecovery(content) {
    return replaceAny(
      content,
      [
        `\t\tif (this.#hasReplayUnsafeOutput(message) && !replaySafeUnexecutedTools) return false;
\t\tif (AIError.is(id, AIError.Flag.AccountPolicy) || this.isClassifierRefusal(message)) return true;
\t\treturn AIError.retriable(id);`,
        `\t\tconst providerFinishErrorReplaySafe =
\t\t\tAIError.is(id, AIError.Flag.ProviderFinishError) &&
\t\t\t!message.content.some(
\t\t\t\tblock => block.type === "toolCall" || block.type === "image" || block.type === "anthropicServerTool",
\t\t\t);
\t\tif (this.#hasReplayUnsafeOutput(message) && !replaySafeUnexecutedTools && !providerFinishErrorReplaySafe) return false;
\t\tif (providerFinishErrorReplaySafe) return true;
\t\tif (AIError.is(id, AIError.Flag.AccountPolicy) || this.isClassifierRefusal(message)) return true;
\t\treturn AIError.retriable(id);`,
      ],
      `\t\tconst providerFinishErrorReplaySafe =
\t\t\tAIError.is(id, AIError.Flag.ProviderFinishError) &&
\t\t\t!message.content.some(
\t\t\t\tblock => block.type === "toolCall" || block.type === "image" || block.type === "anthropicServerTool",
\t\t\t);
\t\tif (this.#hasReplayUnsafeOutput(message) && !replaySafeUnexecutedTools && !providerFinishErrorReplaySafe) return false;
\t\tif (providerFinishErrorReplaySafe) return true;
\t\tif (AIError.is(id, AIError.Flag.AccountPolicy) || this.isClassifierRefusal(message)) return true;
\t\treturn AIError.retriable(id);`,
      "turn-recovery retries provider finish_reason after partial text",
    ).content;
  }

  function patchPiAiTypes(content) {
    const current = `export function serviceTierFamily(model: ServiceTierModel): ServiceTierFamily | undefined {
	const provider = model.provider;
	if (provider === "openrouter") {`;
    const previousLunaOnly = `export function serviceTierFamily(model: ServiceTierModel): ServiceTierFamily | undefined {
	if (model.provider === "omniroute" && model.id === "cx/gpt-5.6-luna") return "openai";
	const provider = model.provider;
	if (provider === "openrouter") {`;
    const previousPatched = `export function serviceTierFamily(model: ServiceTierModel): ServiceTierFamily | undefined {
\tif (model.provider === "omniroute") return model.id === "cx/gpt-5.6-luna" ? "openai" : undefined;
\tconst provider = model.provider;
\tif (provider === "openrouter") {`;
    const previousPatchedV6 = `export function serviceTierFamily(model: ServiceTierModel): ServiceTierFamily | undefined {
\tif (model.provider === "omniroute") return model.id === "cx/gpt-6-luna" ? "openai" : undefined;
\tconst provider = model.provider;
\tif (provider === "openrouter") {`;
    const patched = `export function serviceTierFamily(model: ServiceTierModel): ServiceTierFamily | undefined {
	if (model.provider === "omniroute") return model.id === "cx/gpt-6-luna" ? "openai" : undefined;
	const provider = model.provider;
	if (provider === "openrouter") {`;
    return replaceAny(
      content,
      [current, previousLunaOnly, previousPatched, previousPatchedV6, patched],
      patched,
      "pi-ai Luna-only service tier family",
    ).content;
  }

  function patchModelControlsLunaPriority(content) {
    const currentV18_17_0 =
      `/**
 * Effective wire service tier for a request to ` +
      "`model`" +
      ` under the per-family
 * ` +
      "`tiers`" +
      `. Fireworks models take the Priority serving path only when the
 * Providers › Fireworks Tier setting is ` +
      '`"priority"`' +
      ` (and never for ` +
      "`-fast`" +
      `
 * variants, whose Fast serving path is mutually exclusive with Priority).
 */
export function serviceTierForModel(
\tsettings: Settings,
\tmodel: Model,
\ttiers: ServiceTierByFamily,
): ServiceTier | undefined {
\tif (model.provider === "fireworks") {
\t\treturn cfgProvidersFireworksTier.get(settings) === "priority" && !isFireworksFastModelId(model.id)
\t\t\t? "priority"
\t\t\t: undefined;
\t}
\treturn resolveModelServiceTier(tiers, model);
}`;
    const patchedV18_17_0 = currentV18_17_0.replace(
      "\treturn resolveModelServiceTier(tiers, model);",
      '\tif (model.provider === "omniroute" && model.id === "cx/gpt-6-luna") return "priority";\n\treturn resolveModelServiceTier(tiers, model);',
    );
    if (content.includes(patchedV18_17_0)) return content;
    if (content.includes(currentV18_17_0))
      return content.replace(currentV18_17_0, patchedV18_17_0);
    throw new Error(
      "Luna always uses priority service tier: unknown upstream shape",
    );
  }

  function patchModelRegistryCatalog(content) {
    let out = content;
    let r;

    // OMP 18.8.7 removed the older catalog/composition helpers. Its resolved-model
    // merge helper is the remaining stable choke point for cached and discovered rows.
    const currentMerge = `\t#mergeResolvedModels(baseModels: Model<Api>[], replacementModels: Model<Api>[]): Model<Api>[] {\n\t\treturn mergeByModelKey(baseModels, replacementModels, (existing, replacementModel) => {\n\t\t\tif (!existing) return replacementModel;\n\t\t\tconst contextWindow = replacementModel.contextWindow ?? existing.contextWindow;\n\t\t\tconst maxTokens = replacementModel.maxTokens ?? existing.maxTokens;\n\t\t\tconst omitMaxOutputTokens = replacementModel.omitMaxOutputTokens ?? existing.omitMaxOutputTokens;\n\t\t\tconst supportsTools = replacementModel.supportsTools ?? existing.supportsTools;\n\t\t\tif (\n\t\t\t\tcontextWindow === replacementModel.contextWindow &&\n\t\t\t\tmaxTokens === replacementModel.maxTokens &&\n\t\t\t\tomitMaxOutputTokens === replacementModel.omitMaxOutputTokens &&\n\t\t\t\tsupportsTools === replacementModel.supportsTools\n\t\t\t) {\n\t\t\t\treturn replacementModel;\n\t\t\t}\n\t\t\treturn {\n\t\t\t\t...replacementModel,\n\t\t\t\tcontextWindow,\n\t\t\t\tmaxTokens,\n\t\t\t\tomitMaxOutputTokens,\n\t\t\t\t...(supportsTools !== undefined ? { supportsTools } : {}),\n\t\t\t};\n\t\t});\n\t}`;
    const patchedMerge = `\t#mergeResolvedModels(baseModels: Model<Api>[], replacementModels: Model<Api>[]): Model<Api>[] {\n\t\tconst merged = mergeByModelKey(baseModels, replacementModels, (existing, replacementModel) => {\n\t\t\tif (!existing) return replacementModel;\n\t\t\tconst contextWindow = replacementModel.contextWindow ?? existing.contextWindow;\n\t\t\tconst maxTokens = replacementModel.maxTokens ?? existing.maxTokens;\n\t\t\tconst omitMaxOutputTokens = replacementModel.omitMaxOutputTokens ?? existing.omitMaxOutputTokens;\n\t\t\tconst supportsTools = replacementModel.supportsTools ?? existing.supportsTools;\n\t\t\tif (\n\t\t\t\tcontextWindow === replacementModel.contextWindow &&\n\t\t\t\tmaxTokens === replacementModel.maxTokens &&\n\t\t\t\tomitMaxOutputTokens === replacementModel.omitMaxOutputTokens &&\n\t\t\t\tsupportsTools === replacementModel.supportsTools\n\t\t\t) {\n\t\t\t\treturn replacementModel;\n\t\t\t}\n\t\t\treturn {\n\t\t\t\t...replacementModel,\n\t\t\t\tcontextWindow,\n\t\t\t\tmaxTokens,\n\t\t\t\tomitMaxOutputTokens,\n\t\t\t\t...(supportsTools !== undefined ? { supportsTools } : {}),\n\t\t\t};\n\t\t});\n\t\treturn merged.filter(model => !(model.provider === "openrouter" && model.id === "deepseek/deepseek-v4-flash:free"));\n\t}`;
    if (out.includes(currentMerge) || out.includes(patchedMerge)) {
      return replaceAny(
        out,
        [currentMerge, patchedMerge],
        patchedMerge,
        "drop retired openrouter :free from current model merge",
      ).content;
    }

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
        `\t\tconst withModelOverrides = this.#applyModelOverrides(collapseBuiltModelVariants(combined), this.#modelOverrides);\n\t\tconst withProviderGuardrails = this.#applyProviderGuardrailOverrides(withModelOverrides);\n\t\treturn this.#applyLlamaCppModelFixups(this.#applyRuntimeProviderOverrides(withProviderGuardrails));\n\t}`,
        `\t\tconst withModelOverrides = this.#applyModelOverrides(collapseBuiltVariants(combined), this.#modelOverrides);\n\t\tconst withProviderGuardrails = this.#applyProviderGuardrailOverrides(withModelOverrides);\n\t\treturn this.#applyLlamaCppModelFixups(this.#applyRuntimeProviderOverrides(withProviderGuardrails));\n\t}`,
        `\t\tconst withModelOverrides = this.#applyModelOverrides(collapseBuiltModelVariants(combined), this.#modelOverrides);\n\t\t// Drop the stale bundled deepseek/deepseek-v4-flash:free model from the\n\t\t// final composition (the 24h model cache merge also carries it).\n\t\tconst pruned = withModelOverrides.filter(\n\t\t\tmodel => !(model.provider === "openrouter" && model.id === "deepseek/deepseek-v4-flash:free"),\n\t\t);\n\t\treturn this.#applyLlamaCppModelFixups(this.#applyRuntimeProviderOverrides(pruned));\n\t}`,
        `\t\tconst withModelOverrides = this.#applyModelOverrides(collapseBuiltModelVariants(combined), this.#modelOverrides);\n\t\tconst withProviderGuardrails = this.#applyProviderGuardrailOverrides(withModelOverrides);\n\t\t// Drop the stale bundled deepseek/deepseek-v4-flash:free model from the\n\t\t// final composition (the 24h model cache merge also carries it).\n\t\tconst pruned = withProviderGuardrails.filter(\n\t\t\tmodel => !(model.provider === "openrouter" && model.id === "deepseek/deepseek-v4-flash:free"),\n\t\t);\n\t\treturn this.#applyLlamaCppModelFixups(this.#applyRuntimeProviderOverrides(pruned));\n\t}`,
        `\t\tconst withModelOverrides = this.#applyModelOverrides(collapseBuiltVariants(combined), this.#modelOverrides);\n\t\tconst withProviderBedrock = this.#applyProviderBedrockOverrides(withModelOverrides);\n\t\treturn this.#applyLlamaCppModelFixups(this.#applyRuntimeProviderOverrides(withProviderBedrock));\n\t}`,
        `\t\tconst withModelOverrides = this.#applyModelOverrides(collapseBuiltVariants(combined), this.#modelOverrides);\n\t\tconst withProviderGuardrails = this.#applyProviderGuardrailOverrides(withModelOverrides);\n\t\t// Drop the stale bundled deepseek/deepseek-v4-flash:free model from the\n\t\t// final composition (the 24h model cache merge also carries it).\n\t\tconst pruned = withProviderGuardrails.filter(\n\t\t\tmodel => !(model.provider === "openrouter" && model.id === "deepseek/deepseek-v4-flash:free"),\n\t\t);\n\t\treturn this.#applyLlamaCppModelFixups(this.#applyRuntimeProviderOverrides(pruned));\n\t}`,
        `\t\tconst withModelOverrides = this.#applyModelOverrides(collapseBuiltVariants(combined), this.#modelOverrides);\n\t\tconst withProviderBedrock = this.#applyProviderBedrockOverrides(withModelOverrides);\n\t\treturn this.#applyDiscoveryPolicies(this.#applyRuntimeProviderOverrides(withProviderBedrock));\n\t}`,
        `\t\tconst withModelOverrides = this.#applyModelOverrides(collapseBuiltVariants(combined), this.#modelOverrides);\n\t\tconst withProviderBedrock = this.#applyProviderBedrockOverrides(withModelOverrides);\n\t\t// Drop the stale bundled deepseek/deepseek-v4-flash:free model from the\n\t\t// final composition (the 24h model cache merge also carries it).\n\t\tconst pruned = withProviderBedrock.filter(\n\t\t\tmodel => !(model.provider === "openrouter" && model.id === "deepseek/deepseek-v4-flash:free"),\n\t\t);\n\t\treturn this.#applyDiscoveryPolicies(this.#applyRuntimeProviderOverrides(pruned));\n\t}`,
      ],
      `\t\tconst withModelOverrides = this.#applyModelOverrides(collapseBuiltVariants(combined), this.#modelOverrides);\n\t\tconst withProviderBedrock = this.#applyProviderBedrockOverrides(withModelOverrides);\n\t\t// Drop the stale bundled deepseek/deepseek-v4-flash:free model from the\n\t\t// final composition (the 24h model cache merge also carries it).\n\t\tconst pruned = withProviderBedrock.filter(\n\t\t\tmodel => !(model.provider === "openrouter" && model.id === "deepseek/deepseek-v4-flash:free"),\n\t\t);\n\t\treturn this.#applyDiscoveryPolicies(this.#applyRuntimeProviderOverrides(pruned));\n\t}`,
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

  return {
    patchPiAiOpenAICompletions,
    patchTurnRecovery,
    patchPiAiTypes,
    patchModelControlsLunaPriority,
    patchModelRegistryCatalog,
  };
}
