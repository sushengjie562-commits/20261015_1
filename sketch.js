// 宣告全域變數
let questionsTable; // 儲存從 Google 試算表 CSV 載入的原始資料表格
let questions = []; // 儲存解析並隨機抽出的 5 題測驗題目陣列
let currentQuestionIndex = 0; // 當前正在進行的題目索引 (0 到 4)
let score = 0; // 記錄答對的總題數
let selectedOption = null; // 記錄使用者點選的選項索引 (0 到 3)，未選擇時為 null
let showFeedback = false; // 是否正在顯示答題結果反饋狀態 (true/false)
let animTime = 0; // 計時器，用於計算選項動畫的移動與跳動效果
let nextButton; // 下一題按鈕物件
let isLoading = true; // 標記 CSV 檔案是否仍在讀取中

// 🔥 請將下方網址替換為老師發布到網路的 Google 試算表 CSV 網址 🔥
let googleSheetCSVUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQBEGjpYKFg6sz1xUUwNKxWJ5ttlOB7rP74qqou3Irgs-BWAHvP9MpJ5iOP9W9MgSgdWgvyPC05drP-/pub?gid=2106125057&single=true&output=csv';

// 響應式佈局變數 (將根據視窗大小動態計算)
let layout = {
  fontSizeTitle: 24,
  fontSizeOption: 18,
  fontSizeScore: 32,
  optionWidth: 300,
  optionHeight: 50,
  startY: 150,
  gap: 15,
  btnWidth: 120,
  btnHeight: 40
};

// 預先載入 Google 試算表的 CSV 資料
function preload() {
  // 載入發布到網路的 Google 試算表 CSV 網址，指定含有標題列 ('header') 與 CSV 格式 ('csv')
  questionsTable = loadTable(googleSheetCSVUrl, 'csv', 'header');
}

function setup() {
  // 建立與視窗同等大小的全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 設定文字對齊方式為水平居中、垂直居中
  textAlign(CENTER, CENTER);
  // 設定畫布文字字型：英數字採用 Isometric，中文採用 Noto Sans HK
  textFont("'Isometric', 'Noto Sans HK', sans-serif");

  // 解析 Google 試算表 CSV 資料並隨機抽題
  parseAndSelectQuestions();

  // 建立「下一題」按鈕並設定預設文字
  nextButton = createButton('下一題');
  // 綁定按鈕點擊事件，觸發 goToNextQuestion 函式
  nextButton.mousePressed(goToNextQuestion);
  // 預設隱藏按鈕，直到使用者選擇答案後才顯示
  nextButton.hide();

  // 第一次執行響應式尺寸計算與按鈕樣式設定
  calculateLayout();
}

// 解析 Google 試算表 CSV 題庫資料並隨機抽出 5 題
function parseAndSelectQuestions() {
  let allQuestions = [];

  // 逐列讀取 CSV 表格中的題目資料
  for (let i = 0; i < questionsTable.getRowCount(); i++) {
    let row = questionsTable.getRow(i);
    allQuestions.push({
      question: row.getString('question'),
      options: [
        row.getString('option1'),
        row.getString('option2'),
        row.getString('option3'),
        row.getString('option4')
      ],
      answer: parseInt(row.getString('answer')) // 將答案索引轉換為數字整數
    });
  }

  // 將題庫陣列進行隨機洗牌 (Shuffle)
  allQuestions = shuffle(allQuestions);

  // 抽取前 5 題作為本次測驗題目 (若題庫不足 5 題則全部取出)
  questions = allQuestions.slice(0, min(5, allQuestions.length));
  isLoading = false; // 完成題庫載入與抽題
}

function draw() {
  // 設定背景顏色為淺灰色
  background(240);
  // 累加動畫時間變數，控制動畫順暢度
  animTime += 0.1;

  // 判斷是否還在讀取題庫資料
  if (isLoading) {
    textSize(20);
    fill(100);
    text("題庫載入中...", width / 2, height / 2);
    return;
  }

  // 判斷是否所有題目均已測驗完畢
  if (currentQuestionIndex >= questions.length) {
    // 呼叫顯示最終成績畫面函式
    drawScoreScreen();
  } else {
    // 呼叫顯示當前題目與選項畫面函式
    drawQuizScreen();
  }
}

// 動態計算響應式佈局尺寸 (因應電腦、平板、手機直向/橫向)
function calculateLayout() {
  // 檢測是否為極小螢幕或極低高度畫面 (例如手機橫向)
  let isSmallScreen = width < 600 || height < 500;
  let isShortScreen = height < 450; // 手機橫向的特殊極低高度處理

  // 動態調整字體大小，避免手機上字體過大超出螢幕
  layout.fontSizeTitle = constrain(width * 0.04, 16, 26);
  if (isShortScreen) layout.fontSizeTitle = 15; // 針對橫向短螢幕適度縮小

  layout.fontSizeOption = constrain(width * 0.035, 13, 18);
  layout.fontSizeScore = constrain(width * 0.06, 22, 38);

  // 動態計算選項框寬度 (自動限制最大與最小值，保持完美佔比)
  layout.optionWidth = constrain(width * 0.85, 260, 500);

  // 動態調整選項框高度與間距
  if (isShortScreen) {
    layout.optionHeight = 32;
    layout.gap = 8;
    layout.startY = height * 0.28;
  } else if (isSmallScreen) {
    layout.optionHeight = 42;
    layout.gap = 12;
    layout.startY = height * 0.28;
  } else {
    layout.optionHeight = 52;
    layout.gap = 18;
    layout.startY = height * 0.32;
  }

  // 動態計算按鈕尺寸與定位
  layout.btnWidth = constrain(width * 0.3, 100, 160);
  layout.btnHeight = isShortScreen ? 32 : 42;

  // 更新下一題按鈕的位置與 CSS 樣式
  if (nextButton) {
    nextButton.position(width / 2 - layout.btnWidth / 2, height - layout.btnHeight - (isShortScreen ? 10 : 25));
    nextButton.size(layout.btnWidth, layout.btnHeight);
    nextButton.style('font-family', "'Isometric', 'Noto Sans HK', sans-serif"); // 設定按鈕雙字型搭配
    nextButton.style('font-size', isShortScreen ? '13px' : '16px');
    nextButton.style('border-radius', '8px');
    nextButton.style('border', 'none');
    nextButton.style('background-color', '#4a90e2');
    nextButton.style('color', 'white');
    nextButton.style('cursor', 'pointer');
  }
}

// 繪製測驗題目與選項的主畫面
function drawQuizScreen() {
  // 取得當前題目的資料物件
  let q = questions[currentQuestionIndex];

  // 設定題目文字大小與顏色
  textSize(layout.fontSizeTitle);
  fill(30);
  // 繪製題目內容於畫面上方動態位置 (限制寬度自動換行)
  rectMode(CENTER);
  text(q.question, width / 2, layout.startY * 0.45, width * 0.88, layout.startY * 0.8);
  rectMode(CORNER); // 恢復預設矩形繪製模式

  // 迴圈繪製 4 個選項按鈕
  for (let i = 0; i < q.options.length; i++) {
    // 計算當前選項框的基礎 X 與 Y 座標
    let x = width / 2 - layout.optionWidth / 2;
    let y = layout.startY + i * (layout.optionHeight + layout.gap);

    // 預設選項框背景顏色為純白色
    let bgColor = color(255);

    // 判斷是否處於答題後的反饋狀態
    if (showFeedback) {
      if (selectedOption === q.answer) {
        // 如果答對，將選擇的正確選項設為淺藍顏色 (#bde0fe)
        if (i === q.answer) {
          bgColor = color('#bde0fe');
        }
      } else {
        // 如果答錯，將正確答案選項設為淺藍顏色 (#bde0fe) 並加上上下跳動
        if (i === q.answer) {
          bgColor = color('#bde0fe');
          y += sin(animTime * 2) * 8; // 利用正弦波達到上下跳動效果
        }
        // 將答錯的選項設為紅色 (#dd2d4a) 並加上左右移動
        if (i === selectedOption) {
          bgColor = color('#dd2d4a');
          x += sin(animTime * 3) * 8; // 利用正弦波達到左右搖晃效果
        }
      }
    }

    // 繪製選項的外框矩形背景
    stroke(180); // 邊框顏色
    strokeWeight(1); // 邊框粗細
    fill(bgColor); // 填滿計算出的背景顏色
    rect(x, y, layout.optionWidth, layout.optionHeight, 10); // 繪製圓角矩形

    // 繪製選項的文字內容
    noStroke(); // 禁用文字邊框
    if (showFeedback && i === selectedOption && selectedOption !== q.answer) {
      fill(255); // 答錯的選項文字設為白色，提升對比度
    } else {
      fill(50); // 其餘選項文字設為深灰色
    }
    textSize(layout.fontSizeOption); // 設定響應式選項文字大小
    text(q.options[i], width / 2, y + layout.optionHeight / 2); // 繪製選項文字
  }
}

// 監聽滑鼠點擊與觸控點擊事件
function mousePressed() {
  // 如果正在載入、已進入結算畫面或已經回答當前題目，則不處理點擊選項
  if (isLoading || currentQuestionIndex >= questions.length || showFeedback) {
    return;
  }

  // 取得當前題目資料
  let q = questions[currentQuestionIndex];

  // 檢測滑鼠/觸控點擊是否落在 4 個選項框範圍內
  for (let i = 0; i < q.options.length; i++) {
    let x = width / 2 - layout.optionWidth / 2;
    let y = layout.startY + i * (layout.optionHeight + layout.gap);

    // 判斷觸控/滑鼠座標是否落在該選項矩形內
    if (mouseX > x && mouseX < x + layout.optionWidth && mouseY > y && mouseY < y + layout.optionHeight) {
      selectedOption = i; // 紀錄使用者點選的選項
      showFeedback = true; // 開啟結果反饋顯示狀態

      // 判斷是否答對並採計分數
      if (selectedOption === q.answer) {
        score++; // 答對則加 1 分
      }

      // 顯示「下一題」按鈕
      nextButton.show();
      break;
    }
  }
}

// 切換至下一題的處理函式
function goToNextQuestion() {
  currentQuestionIndex++; // 題目索引加 1
  selectedOption = null; // 重置點選的選項
  showFeedback = false; // 關閉反饋狀態
  nextButton.hide(); // 隱藏下一題按鈕
}

// 繪製最終答對題數的結算畫面
function drawScoreScreen() {
  textSize(layout.fontSizeScore); // 設定響應式標題文字大小
  fill(30); // 設定文字顏色
  text("測驗結束！", width / 2, height * 0.38); // 繪製結束文字

  textSize(layout.fontSizeOption * 1.3); // 設定動態分數文字大小
  fill('#2b2d42'); // 設定分數文字顏色
  // 顯示最終答對的題數與總題數
  text(`您的得分為：${score} / ${questions.length} 題`, width / 2, height * 0.5);
}

// 當瀏覽器視窗大小改變或手機螢幕旋轉（直向/橫向切換）時自動觸發
function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // 重新調整畫布尺寸為全螢幕
  calculateLayout(); // 重新計算所有元件的響應式比例與位置
}