-- Inline-подсказки через свой OmniRoute, замена отключённому Codeium.
-- В репозитории только ИМЯ переменной окружения, сам ключ в git не попадает.
return {
  {
    'milanglacier/minuet-ai.nvim',
    priority = 200, -- после blink.cmp
    config = function()
      require('minuet').setup({
        provider = 'openai_compatible',
        provider_options = {
          openai_compatible = {
            name = 'OmniRoute',
            end_point = 'https://router.hwqtpa.easypanel.host/v1/chat/completions',
            api_key = 'OMNIROUTE_PI_API_KEY',
            -- Самая дешёвая и быстрая модель роутера; reasoning отключаем явно
            model = 'opencode-go/deepseek-v4.1-flash',
            stream = true,
            optional = { max_tokens = 256, reasoning_effort = 'none' },
          },
        },
        virtualtext = {
          -- Автотриггер везде, как было у codeium
          auto_trigger_ft = { '*' },
          auto_trigger_ignore_ft = { 'oil', 'minifiles', 'netrw', 'qf', 'checkhealth', 'fzf', 'TelescopePrompt', 'noice', 'DressingInput', 'gitcommit', 'gitrebase' },
          -- Привычные бинды со времён codeium
          keymap = {
            accept = '<Tab>',
            accept_line = '<M-l>',
            next = '<M-n>',
            prev = '<M-p>',
          },
        },
      })
    end,
  },
}
