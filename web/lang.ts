type Fields = 'quantum_flags' | 'tool_shovel' | 'classic_flag' | 'quant_flag' | 'collapse' | 'new_game' | 'instruction_button' | 'game_settings' | 'label_width' | 'label_height' | 'label_mines' | 'label_uncentainty' | 'start_game' | 'instruction_header' | 'instruction';
type Lang = Record<Fields, string>;

export const RU : Lang = {
    quantum_flags: "Квантовые флажки: ",
    tool_shovel: "Лопата",
    classic_flag: "Обычный флажок",
    quant_flag: "Квантовый флажок",
    collapse: "Сколлапсировать",
    new_game: "Новая игра",
    instruction_button: "Как играть",
    game_settings: "Настройки игры",
    label_width: "Ширина (5-30):",
    label_height: "Высота (5-22):",
    label_mines: "Квантовые мины (%):",
    label_uncentainty: "Коэффициент запутанности (%):",
    start_game: "Начать игру",
    instruction_header: "Инструкция",
    instruction: "&bull; Все мины находятся в суперпозиции - то есть на нескольких клетках сразу<br>&bull; Вероятность равна 1 / количество присоединенных клеток<br>&bull; Клетка показывает сумму вероятностей вокруг<br>&bull; После коллапса мина оказывается на случайной присоединенной клетке<br>&bull; Для безопасного коллапса используйте квантовые флажки и кнопку \"Сколлапсировать\"<br>&bull; Победа будет, когда все клетки открыты, а мины сколлапсированы и помечены обычными флажками<br>&bull; \"Квантовые мины\" - процент мин от общего числа клеток<br>&bull; \"Коэффициент запутанности\" - процент клеток, которые будут распределены минам от общего числа"
};

export const EN : Lang = {
    quantum_flags: "Quantum flags: ",
    tool_shovel: "Shovel",
    classic_flag: "Classic flag",
    quant_flag: "Quantum flag",
    collapse: "Collapse",
    new_game: "New Game",
    instruction_button: "How to play",
    game_settings: "Game Settings",
    label_width: "Width (5-30):",
    label_height: "Height (5-22):",
    label_mines: "Quantum mines (%):",
    label_uncentainty: "Uncertainty Factor (%):",
    start_game: "Start Game",
    instruction_header: "Instruction",
    instruction: "&bull; All mines in superposition - are at several tiles<br>&bull; Probability is equal 1 / mine-linked tile count<br>&bull; Tiles show sum of probabilities around<br>&bull; After collapse mine go to random linked tile<br>&bull; To safety collapse tile use quantum flag and \"Collapse\" button<br>&bull; ПYou will win, when all tiles are opened and all mines was collapsed and marked classic flags<br>&bull; \"Quantum mines\" - percent of mines from total tiles count<br>&bull; \"Uncertainty Factor\" - percent of tiles that will be distributed to mines from total tiles count"
};

async function setStrings(data : Lang): Promise<void> {
    $('#quant-flags').text(data.quantum_flags);
    $('#tool-shovel').text(data.tool_shovel);
    $('#classic-flag').text(data.classic_flag);
    $('#quant-flag').text(data.quant_flag);
    $('#collapse').text(data.collapse);
    $('#new-game').text(data.new_game);
    $('#instruction').text(data.instruction_button);
    $('#settings-header').text(data.game_settings);
    $('#lwidth').text(data.label_width);
    $('#lheight').text(data.label_height);
    $('#lgroups').text(data.label_mines);
    $('#lcand').text(data.label_uncentainty);
    $('#start-game').text(data.start_game);
    $('#instruction-header').text(data.instruction_header);
    $('#instruction-text').html(data.instruction)
}

export const LANGUAGES: Record<string, Lang> = {
    'ru': RU,
    'ru-RU': RU,
    'en': EN,
    'en-US': EN,
    'en-GB': EN
};

export async function initLanguage(): Promise<void> {
    const browserLanguage = navigator.language;
    let lang: Lang;
    if (LANGUAGES[browserLanguage]) {
        lang = LANGUAGES[browserLanguage];
    } 
    else {
        const baseLanguage = browserLanguage.split('-')[0];
        lang = LANGUAGES[baseLanguage] || EN;
    }
    await setStrings(lang);

    localStorage.setItem('preferredLanguage', browserLanguage);
}