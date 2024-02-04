const card_list = { "B": 1.5, "A": 1.0, "Q": 0.8 }; //宝具色補正
const correctio_lv90 = { "0": 1.390, "1": 1.508, "2": 1.390, "3": 1.289, "4": 1.126, "5": 1.000 };
const correctio_lv100 = { "0": 1.546, "1": 1.677, "2": 1.546, "3": 1.434, "4": 1.253, "5": 1.112 };
const correctio_lv110 = { "0": 1.703, "1": 1.847, "2": 1.703, "3": 1.579, "4": 1.379, "5": 1.224 };
const correctio_lv120 = { "0": 1.859, "1": 2.016, "2": 1.859, "3": 1.724, "4": 1.506, "5": 1.337 };
const classScore_class = ["Saber","Archer","Lancer","Rider","Caster","Assasin","Berserker","EX1","EX2"];
const defaultRow = 15; // 初期行数
const maxLineNum = 4; // メモ改行数
const maxWidthAdvanced = 232;
const maxWidthMemo = 120;
const maxWidthClose = 1276;
const localStorageKey_InputData = "fgodamagecalculator_input"
const localStorageKey_Setting = "fgodamagecalculator_setting"
const localStorageKey_BuffPreset = "fgodamagecalculator_buffpreset"
const localStorageKey_ClassScore = "fgodamagecalculator_classscore"
const downloadSaveFileName = "fgo_damage_calc.sav"
var rowNumber = 0; // 現在行数
var selDamageTotal = 0;
var selDamageNum = 0;
var advancedSettingFlag = false;
var memoSettingFlag = false;
var servantList = null;
var buffPresetDataList = [];
var classScoreDataList = [];

$(function(){
    /**
     * フォーカスイベント
     */
    $(document).on("focus", "input", function () {
        
        // フォーカス時に選択する
        this.select();

    });

    /**
     * フォーカスイベント
     */
    $(document).on("focus", "textarea", function () {
        
        // フォーカス時に選択する
        this.select();

    });

    /**
     * 表計算フォーカス遷移イベント
     */
    $("#calcTable").on("blur", "input", function () {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

        // ブランクなら0を入れる
        if (this.value == "") {
            if (this.id == "atk_" + recNumber) {
                // atkがブランクなら初期化
                clearParam(recNumber);
            }
            else {
                this.value = "0";
            }
        }

        // 数値変換
        this.value = parseFloat(this.value);

        // 対象行を計算
        calcMain(recNumber);
        
        // 選択トータルを初期化
        clearSelTotal(recNumber);
    });

    /**
     * セレクトボックス変更イベント
     */
    $(document).on("change", "select", function () {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

        // 対象行を計算
        calcMain(recNumber);

        // 選択トータル初期化
        clearSelTotal();

    });

    /**
     * メモ改行制御
     */
    $(".memo").keypress(function(e) { 
        var c = e.which ? e.which : e.keyCode; // クロスブラウザ対応
        // 各行を配列の要素に分ける
        var lines = this.value.split("\n");

        // 改行制限を超えた場合キャンセル
        if (c == 13) {
            if (lines.length >= maxLineNum) {
                return false;
             }
        }

    });

    /**
     * ↑入れ替え
     */
    $(document).on("click", ".up_change_link", function() {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];
        var recNext = Number(recNumber) - 1;

        // ドロップダウンメニューを閉じる
        $(".dropdown-menu").removeClass("show");

        // 行入れ替え実行
        changeParam(recNumber, recNext);

        // 再計算
        calcMain(recNumber);
        calcMain(recNext);

        return false;

    });

    /**
     * ↓入れ替え
     */
    $(document).on("click", ".down_change_link", function() {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];
        var recNext = Number(recNumber) + 1;

        // ドロップダウンメニューを閉じる
        $(".dropdown-menu").removeClass("show");

        // 行入れ替え実行
        changeParam(recNumber, recNext);

        // 再計算
        calcMain(recNumber);
        calcMain(recNext);

        return false;

    });

    /**
     * ↑コピー
     */
    $(document).on("click", ".up_copy_link", function() {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];
        var recNext = Number(recNumber) - 1;

        // ドロップダウンメニューを閉じる
        $(".dropdown-menu").removeClass("show");

        // 行コピー実行
        copyParam(recNumber, recNext);

        // コピー先を再計算
        calcMain(recNext);

        return false;

    });

    /**
     * ↓コピー
     */
    $(document).on("click", ".down_copy_link", function() {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];
        var recNext = Number(recNumber) + 1;

        // ドロップダウンメニューを閉じる
        $(".dropdown-menu").removeClass("show");

        // 行コピー実行
        copyParam(recNumber, recNext);

        // コピー先を再計算
        calcMain(recNext);

        return false;

    });

    /**
     * 設定押下イベント
     */
    $(document).on("click", "#setting", function() {

        // 保持したスイッチを適用
        $("#advanced_setting")[0].checked = advancedSettingFlag;
        $("#memo_setting")[0].checked = memoSettingFlag;

    });

    /**
     * 設定＞適用ボタン押下イベント
     */
    $(document).on("click", "#accept", function() {

        var maxWidth = maxWidthClose;

        // 高度なバフ設定表示
        if ($("#advanced_setting")[0].checked){
            $(".col_advanced_setting").css({"display":"table-cell"});
            maxWidth += maxWidthAdvanced;
        }
        else {
            $(".col_advanced_setting").css({"display":"none"});
        }

        // メモ列表示
        if ($("#memo_setting")[0].checked){
            $(".col_memo").css({"display":"table-cell"});
            maxWidth += maxWidthMemo;
        }
        else {
            $(".col_memo").css({"display":"none"});
        }

        $(".calc").css({"max-width":maxWidth + "px"});

        // スイッチを保持
        advancedSettingFlag = $("#advanced_setting")[0].checked;
        memoSettingFlag = $("#memo_setting")[0].checked;

        // ローカルストレージに格納
        if (window.localStorage) {
            let json = {
                    "advanced_setting": $("#advanced_setting")[0].checked
                    , "memo_setting" : $("#memo_setting")[0].checked
                };
            localStorage.setItem(localStorageKey_Setting, JSON.stringify(json));
        }
    });

    /**
     * 保存押下イベント
     */
    $(document).on("click", "#save", function() {

        var recDataArray = [];
        var row = defaultRow + rowNumber;

        // 入力値を取得
        for (let cnt = 0; cnt < row; cnt++){
            // 行のパラメーターを初期化
            recDataArray.push(getRecData(cnt));
        }

        // jsonに変換しローカルストレージへ格納
        if (window.localStorage) {
            let json = JSON.stringify(recDataArray, undefined, 1);
            localStorage.setItem(localStorageKey_InputData, json);
        }

        return false;

    });

    /**
     * 読込押下イベント
     */
    $(document).on("click", "#load", function() {

        // ローカルストレージの入力を適用する
        if (window.localStorage) {
            let json = localStorage.getItem(localStorageKey_InputData);
	        let recDataArray = JSON.parse(json);

            if (recDataArray != null) {
                for (let cnt = 0; cnt < recDataArray.length; cnt++) {
                    setRecData(cnt, recDataArray[cnt]);
                    // 適用後再計算
                    calcMain(cnt);
                }
            }
        }

        return false;

    });

    /**
     * ファイル保存押下イベント
     */
    $(document).on("click", "#file_save", function() {

        var recDataArray = [];
        var row = defaultRow + rowNumber;
        var now = new Date().toLocaleDateString("ja-JP", {year: "numeric",month: "2-digit",day: "2-digit",hour: "2-digit",minute: "2-digit",second: "2-digit"}).replaceAll("/", "").replaceAll(":", "").replaceAll(/\s+/g, "")

        // 入力値を取得
        for (let cnt = 0; cnt < row; cnt++){
            // 行のパラメーターを初期化
            recDataArray.push(getRecData(cnt));
        }

        // json変換
        let json = JSON.stringify(recDataArray, undefined, 1);

        const blob = new Blob([json], { type: 'text/plain' });
        const aTag = document.createElement('a');
        aTag.href = URL.createObjectURL(blob);
        aTag.target = '_blank';
        aTag.download = now + "_" + downloadSaveFileName;
        aTag.click();
        URL.revokeObjectURL(aTag.href);

        return false;

    });

    /**
     * ファイル読込押下イベント
     */
    $(document).on("click", "#file_load", function() {

        $("#formFile").click();

        return false;

    });

    /**
     * ファイル選択イベント
     */
    $(document).on("change", "#formFile", function(evt) {

        // FileListオブジェクト取得
        const files = evt.target.files;

        // FileReaderオブジェクト取得
        const reader = new FileReader();
        reader.readAsText(files[0]);

        //読込終了後の処理
        reader.onload = function(ev){
            //テキストエリアに表示する
            let json = reader.result;
            let recDataArray = JSON.parse(json);

            if (recDataArray != null) {
                for (let cnt = 0; cnt < recDataArray.length; cnt++) {
                    setRecData(cnt, recDataArray[cnt]);
                    // 適用後再計算
                    calcMain(cnt);
                }
            }

        }

        // 初期化
        $("#formFile").val("");

        return false;

    });

    /**
     * クリアボタンイベント
     */
    $(document).on("click", ".clear", function() {

        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

        // ドロップダウンメニューを閉じる
        $(".dropdown-menu").removeClass("show");

        // 行のパラメーターを初期化
        clearParam(recNumber);

        // 選択トータル初期化
        clearSelTotal();

        return false;

    });

    /**
     * 計算結果押下イベント
     */
    $(document).on("click", ".wrap_dmg_result", function() {

        if ($(this).css("background-color") == "rgb(255, 255, 197)") {
            $(this).css({"background":""});
            selDamageTotal = selDamageTotal - Number($(this).children("output").val().replace(/,/g, ""));
            selDamageNum -= 1;
        }
        else {
            $(this).css({"background":"#FFFFC5"});
            selDamageTotal = selDamageTotal + Number($(this).children("output").val().replace(/,/g, ""));
            selDamageNum += 1;
        }
        
        $("#out_sel_total").val(Number(selDamageTotal).toLocaleString());

        if (selDamageNum > 0) {
            $(".sel_total").css({"display":"flex"})
        }
        else {
            $(".sel_total").css({"display":""})
        }

    });

    /**
     * 画面表示後
     */
    $(document).ready(function(){

        // ローカルストレージの入力を適用する
        if (window.localStorage) {
            let json = localStorage.getItem(localStorageKey_Setting);
            let settingData = JSON.parse(json);
            let maxWidth = maxWidthClose;

            if (json != null) {
                // 高度なバフ設定表示
                advancedSettingFlag = settingData.advanced_setting;
                $("#advanced_setting")[0].checked = advancedSettingFlag
                if ($("#advanced_setting")[0].checked){
                    $(".col_advanced_setting").css({"display":"table-cell"});
                    maxWidth += maxWidthAdvanced;
                }
                else {
                    $(".col_advanced_setting").css({"display":"none"});
                }

                // メモ列表示
                memoSettingFlag = settingData.memo_setting;
                $("#memo_setting")[0].checked = memoSettingFlag
                if ($("#memo_setting")[0].checked){
                    $(".col_memo").css({"display":"table-cell"});
                    maxWidth += maxWidthMemo;
                }
                else {
                    $(".col_memo").css({"display":"none"});
                }

                $(".calc").css({"max-width":maxWidth + "px"});

            }

            // バフプリセット
            let buffpreset_jsonlist = localStorage.getItem(localStorageKey_BuffPreset);

            if (buffpreset_jsonlist != null) {
                // バフプリセットを保持 
                buffPresetDataList = JSON.parse(buffpreset_jsonlist);

                // プリセットセレクトボックス作成
                remakePresetSelectBox();

                // プリセットデータ設定
                setPresetDataUpdDel($("#buffPreset_name").val());
                setPresetDataSel($("#buffPreset_sel_name").val());

            }

            // ピン留め作成
            pinBuffCreate();

            // クラススコア
            let classScore_jsonlist = localStorage.getItem(localStorageKey_ClassScore);

            if (classScore_jsonlist != null) {
                // クラススコアを保持 
                classScoreDataList = JSON.parse(classScore_jsonlist);
                // クラススコアを設定
                setClassScore()
            }
            
        }

        // 初期表示にATK0以外を再計算
        for (let cnt = 0; cnt < defaultRow + rowNumber; cnt++){
            if ($("#atk_" + cnt).val() != "0") {
                // 再計算
                calcMain(cnt);
            }
        }

    });

    //開くボタンをクリックしたらモーダルを表示する
    $(document).on("click", ".prob_link", function() {

        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

        // 行の目標ダメージを復元
        $("#enemy_hp").val($("#prob_hp_" + recNumber).val());

        if ($("#search_servant_no_" + recNumber).val() != "") {
            $("#servant-class").val($("#search_servant_class_" + recNumber).val());
            $("#servant-rare").val($("#search_servant_rare_" + recNumber).val());
            // サーヴァントセレクトボックスを再作成
            remakeServantSelectBox();
            $("#servant-name").val($("#search_servant_no_" + recNumber).val());
        }
        else if ($("#np_star_servant_no_" + recNumber).val() != "") {
            $("#servant-class").val($("#np_star_servant_class_" + recNumber).val());
            $("#servant-rare").val($("#np_star_servant_rare_" + recNumber).val());
            // サーヴァントセレクトボックスを再作成
            remakeServantSelectBox();
            $("#servant-name").val($("#np_star_servant_no_" + recNumber).val());
        }

        $("#NA").val($("#na_" + recNumber).val());
        $("#NA_buff").val($("#na_buff_" + recNumber).val());
        $("#SR").val($("#sr_" + recNumber).val());
        $("#SR_buff").val($("#sr_buff_" + recNumber).val());
        $("#b_hit").val($("#b_hit_" + recNumber).val());
        $("#a_hit").val($("#a_hit_" + recNumber).val());
        $("#q_hit").val($("#q_hit_" + recNumber).val());
        $("#ex_hit").val($("#ex_hit_" + recNumber).val());
        $("#np_hit").val($("#np_hit_" + recNumber).val());
        $("#NA_enemy").val($("#na_enemy_" + recNumber).val());
        $("#SR_enemy").val($("#sr_enemy_" + recNumber).val());

        // スリップダメージを復元
        $("#poison").val($("#poison_" + recNumber).val());
        $("#poison_buff").val($("#poison_buff_" + recNumber).val());
        $("#burn").val($("#burn_" + recNumber).val());
        $("#burn_buff").val($("#burn_buff_" + recNumber).val());
        $("#curse").val($("#curse_" + recNumber).val());
        $("#curse_buff").val($("#curse_buff_" + recNumber).val());
        $("#other_slip").val($("#other_slip_" + recNumber).val());

        // パラメーターを撃破率画面にコピー
        copyProbInput(recNumber);

        // パラメーターをNPスター計算画面にコピー
        copyNpStarInput(recNumber);

        // 撃破率計算
        calcProb();

        // NPスター計算
        calcRate();

        // スリップダメージ計算
        calcSlip();

        // 行番号を保持
        $("#prob_recNumber").val(recNumber);

        return false;

    });

    /**
     * 撃破率フォーカス遷移イベント
     */
    $("#probTable").on("blur", "input", function () {

        if (this.value == "") {this.value = "0";};

        this.value = parseFloat(this.value);

        // 撃破率計算
        calcProb();
        
        // 目標ダメージを保持
        $("#prob_hp_" + $("#prob_recNumber").val()).val($("#enemy_hp").val());

    });

    /**
     * NPスターフォーカス遷移イベント
     */
    $("#npStarTable").on("blur", "input", function () {

        if (this.value == "") {this.value = "0";};

        this.value = parseFloat(this.value);

        // NPスター計算
        calcRate();

        // バフを保持
        $("#na_" + $("#prob_recNumber").val()).val($("#NA").val());
        $("#na_buff_" + $("#prob_recNumber").val()).val($("#NA_buff").val());
        $("#sr_" + $("#prob_recNumber").val()).val($("#SR").val());
        $("#sr_buff_" + $("#prob_recNumber").val()).val($("#SR_buff").val());
        $("#b_hit_" + $("#prob_recNumber").val()).val($("#b_hit").val());
        $("#a_hit_" + $("#prob_recNumber").val()).val($("#a_hit").val());
        $("#q_hit_" + $("#prob_recNumber").val()).val($("#q_hit").val());
        $("#ex_hit_" + $("#prob_recNumber").val()).val($("#ex_hit").val());
        $("#np_hit_" + $("#prob_recNumber").val()).val($("#np_hit").val());
        $("#na_enemy_" + $("#prob_recNumber").val()).val($("#NA_enemy").val());
        $("#sr_enemy_" + $("#prob_recNumber").val()).val($("#SR_enemy").val());

    });

    /**
     * スリップダメージ計算フォーカス遷移イベント
     */
    $("#slipTable").on("blur", "input", function () {

        if (this.value == "") {this.value = "0";};

        this.value = parseFloat(this.value);

        // スリップダメージ計算
        calcSlip();

        // スリップダメージを保持
        $("#poison_" + $("#prob_recNumber").val()).val($("#poison").val());
        $("#poison_buff_" + $("#prob_recNumber").val()).val($("#poison_buff").val());
        $("#burn_" + $("#prob_recNumber").val()).val($("#burn").val());
        $("#burn_buff_" + $("#prob_recNumber").val()).val($("#burn_buff").val());
        $("#curse_" + $("#prob_recNumber").val()).val($("#curse").val());
        $("#curse_buff_" + $("#prob_recNumber").val()).val($("#curse_buff").val());
        $("#other_slip_" + $("#prob_recNumber").val()).val($("#other_slip").val());

    });

    /**
     * セレクトボックス変更イベント
     */
    $(document).on("change", "#NA_enemy", function () {

        var selectedIndex = $("#NA_enemy")[0].selectedIndex;
        var na_enemyClass = $("#NA_enemy")[0][selectedIndex].text;

        if (na_enemyClass.indexOf("特殊") < 0){
            $("#SR_enemy")[0][selectedIndex].selected = true;
        }

    });

    /**
     * セレクトボックス変更イベント
     */
    $(document).on("change", ".select_np_star", function () {

        // NPスター計算
        calcRate();

        // バフを保持
        $("#na_" + $("#prob_recNumber").val()).val($("#NA").val());
        $("#na_buff_" + $("#prob_recNumber").val()).val($("#NA_buff").val());
        $("#sr_" + $("#prob_recNumber").val()).val($("#SR").val());
        $("#sr_buff_" + $("#prob_recNumber").val()).val($("#SR_buff").val());
        $("#b_hit_" + $("#prob_recNumber").val()).val($("#b_hit").val());
        $("#a_hit_" + $("#prob_recNumber").val()).val($("#a_hit").val());
        $("#q_hit_" + $("#prob_recNumber").val()).val($("#q_hit").val());
        $("#ex_hit_" + $("#prob_recNumber").val()).val($("#ex_hit").val());
        $("#np_hit_" + $("#prob_recNumber").val()).val($("#np_hit").val());
        $("#na_enemy_" + $("#prob_recNumber").val()).val($("#NA_enemy").val());
        $("#sr_enemy_" + $("#prob_recNumber").val()).val($("#SR_enemy").val());

    });

    /**
     * エンターキーでフォーカス移動
     * メイン画面
     */
    $("#calcTable").keypress(function(e) { 
        var c = e.which ? e.which : e.keyCode; // クロスブラウザ対応

        // エンターキー
        if (c == 13) {

            var activeObj = $("#" + document.activeElement.id);
            var splitStr = activeObj[0].id.split("_");
            var recNumber = 0;
            var nextIdStr = "";
            var activeIdStr ="";
            var nextObj = null;

            // 遷移先のIDを作成
            for(cnt = 0; cnt < splitStr.length - 1; cnt++){
                activeIdStr = activeIdStr + splitStr[cnt] + "_";
            }

            if (!e.shiftKey) {
                // 下に進む
                recNumber = Number(splitStr[splitStr.length - 1]) + 1;

                 // 遷移先が別IDの場合の対応
                switch (activeIdStr){
                    case "memo_" :
                        break;
                    case "def_debuff_" :
                        nextIdStr = "atk_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "atk_buff_" :
                        nextIdStr = "def_debuff_";
                        recNumber--;
                        break;
                    case "b_card_debuff_" :
                        nextIdStr = "b_card_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "b_card_buff_" :
                        nextIdStr = "b_card_debuff_";
                        recNumber--;
                        break;
                    case "a_card_debuff_" :
                        nextIdStr = "a_card_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "a_card_buff_" :
                        nextIdStr = "a_card_debuff_";
                        recNumber--;
                        break;
                    case "q_card_debuff_" :
                        nextIdStr = "q_card_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "q_card_buff_" :
                        nextIdStr = "q_card_debuff_";
                        recNumber--;
                        break;
                    case "b_card_cri_buff_" :
                        nextIdStr = "a_card_cri_buff_";
                        recNumber--;
                        break;
                    case "a_card_cri_buff_" :
                        nextIdStr = "q_card_cri_buff_";
                        recNumber--;
                        break;
                    case "q_card_cri_buff_" :
                        nextIdStr = "b_card_cri_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "b_card_power_buff_" :
                        nextIdStr = "a_card_power_buff_";
                        recNumber--;
                        break;
                    case "a_card_power_buff_" :
                        nextIdStr = "q_card_power_buff_";
                        recNumber--;
                        break;
                    case "q_card_power_buff_" :
                        nextIdStr = "b_card_power_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "b_footprints_" :
                        nextIdStr = "a_footprints_";
                        recNumber--;
                        break;
                    case "a_footprints_" :
                        nextIdStr = "q_footprints_";
                        recNumber--;
                        break;
                    case "q_footprints_" :
                        nextIdStr = "b_footprints_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_atk_buff_1st_" :
                        nextIdStr = "advanced_atk_buff_2nd_";
                        recNumber--;
                        break;
                    case "advanced_atk_buff_2nd_" :
                        nextIdStr = "advanced_atk_buff_3rd_";
                        recNumber--;
                        break;
                    case "advanced_atk_buff_3rd_" :
                        nextIdStr = "advanced_atk_buff_Ex_";
                        recNumber--;
                        break;
                    case "advanced_atk_buff_Ex_" :
                        nextIdStr = "advanced_atk_buff_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_def_debuff_1st_" :
                        nextIdStr = "advanced_def_debuff_2nd_";
                        recNumber--;
                        break;
                    case "advanced_def_debuff_2nd_" :
                        nextIdStr = "advanced_def_debuff_3rd_";
                        recNumber--;
                        break;
                    case "advanced_def_debuff_3rd_" :
                        nextIdStr = "advanced_def_debuff_Ex_";
                        recNumber--;
                        break;
                    case "advanced_def_debuff_Ex_" :
                        nextIdStr = "advanced_def_debuff_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_card_buff_1st_" :
                        nextIdStr = "advanced_card_buff_2nd_";
                        recNumber--;
                        break;
                    case "advanced_card_buff_2nd_" :
                        nextIdStr = "advanced_card_buff_3rd_";
                        recNumber--;
                        break;
                    case "advanced_card_buff_3rd_" :
                        nextIdStr = "advanced_card_buff_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_card_debuff_1st_" :
                        nextIdStr = "advanced_card_debuff_2nd_";
                        recNumber--;
                        break;
                    case "advanced_card_debuff_2nd_" :
                        nextIdStr = "advanced_card_debuff_3rd_";
                        recNumber--;
                        break;
                    case "advanced_card_debuff_3rd_" :
                        nextIdStr = "advanced_card_debuff_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_cri_buff_1st_" :
                        nextIdStr = "advanced_cri_buff_2nd_";
                        recNumber--;
                        break;
                    case "advanced_cri_buff_2nd_" :
                        nextIdStr = "advanced_cri_buff_3rd_";
                        recNumber--;
                        break;
                    case "advanced_cri_buff_3rd_" :
                        nextIdStr = "advanced_cri_buff_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_supereffective_buff_1st_" :
                        nextIdStr = "advanced_supereffective_buff_2nd_";
                        recNumber--;
                        break;
                    case "advanced_supereffective_buff_2nd_" :
                        nextIdStr = "advanced_supereffective_buff_3rd_";
                        recNumber--;
                        break;
                    case "advanced_supereffective_buff_3rd_" :
                        nextIdStr = "advanced_supereffective_buff_Ex_";
                        recNumber--;
                        break;
                    case "advanced_supereffective_buff_Ex_" :
                        nextIdStr = "advanced_supereffective_buff_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_fixed_dmg_1st_" :
                        nextIdStr = "advanced_fixed_dmg_2nd_";
                        recNumber--;
                        break;
                    case "advanced_fixed_dmg_2nd_" :
                        nextIdStr = "advanced_fixed_dmg_3rd_";
                        recNumber--;
                        break;
                    case "advanced_fixed_dmg_3rd_" :
                        nextIdStr = "advanced_fixed_dmg_Ex_";
                        recNumber--;
                        break;
                    case "advanced_fixed_dmg_Ex_" :
                        nextIdStr = "advanced_fixed_dmg_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_special_def_1st_" :
                        nextIdStr = "advanced_special_def_2nd_";
                        recNumber--;
                        break;
                    case "advanced_special_def_2nd_" :
                        nextIdStr = "advanced_special_def_3rd_";
                        recNumber--;
                        break;
                    case "advanced_special_def_3rd_" :
                        nextIdStr = "advanced_special_def_Ex_";
                        recNumber--;
                        break;
                    case "advanced_special_def_Ex_" :
                        nextIdStr = "advanced_special_def_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    default :
                        nextIdStr = activeIdStr;
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                }
            }
            else {
                // 上に戻る
                recNumber = Number(splitStr[splitStr.length - 1]) - 1;
                
                // 遷移先が別IDの場合の対応
               switch (activeIdStr){
                    case "memo_" :
                        break;
                    case "def_debuff_" :
                        nextIdStr = "atk_buff_";
                        recNumber++;
                        break;
                    case "atk_buff_" :
                        nextIdStr = "def_debuff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "b_card_debuff_" :
                        nextIdStr = "b_card_buff_";
                        recNumber++;
                        break;
                    case "b_card_buff_" :
                        nextIdStr = "b_card_debuff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "a_card_debuff_" :
                        nextIdStr = "a_card_buff_";
                        recNumber++;
                        break;
                    case "a_card_buff_" :
                        nextIdStr = "a_card_debuff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "q_card_debuff_" :
                        nextIdStr = "q_card_buff_";
                        recNumber++;
                        break;
                    case "q_card_buff_" :
                        nextIdStr = "q_card_debuff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "b_card_power_buff_" :
                        nextIdStr = "q_card_power_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "a_card_power_buff_" :
                        nextIdStr = "b_card_power_buff_";
                        recNumber++;
                        break;
                    case "q_card_power_buff_" :
                        nextIdStr = "a_card_power_buff_";
                        recNumber++;
                        break;
                    case "b_card_cri_buff_" :
                        nextIdStr = "q_card_cri_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "a_card_cri_buff_" :
                        nextIdStr = "b_card_cri_buff_";
                        recNumber++;
                        break;
                    case "q_card_cri_buff_" :
                        nextIdStr = "a_card_cri_buff_";
                        recNumber++;
                        break;
                    case "b_footprints_" :
                        nextIdStr = "q_footprints_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "a_footprints_" :
                        nextIdStr = "b_footprints_";
                        recNumber++;
                        break;
                    case "q_footprints_" :
                        nextIdStr = "a_footprints_";
                        recNumber++;
                        break;
                    case "advanced_atk_buff_2nd_" :
                        nextIdStr = "advanced_atk_buff_1st_";
                        recNumber++;
                        break;
                    case "advanced_atk_buff_3rd_" :
                        nextIdStr = "advanced_atk_buff_2nd_";
                        recNumber++;
                        break;
                    case "advanced_atk_buff_Ex_" :
                        nextIdStr = "advanced_atk_buff_3rd_";
                        recNumber++;
                        break;
                    case "advanced_atk_buff_1st_" :
                        nextIdStr = "advanced_atk_buff_Ex_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "advanced_def_debuff_2nd_" :
                        nextIdStr = "advanced_def_debuff_1st_";
                        recNumber++;
                        break;
                    case "advanced_def_debuff_3rd_" :
                        nextIdStr = "advanced_def_debuff_2nd_";
                        recNumber++;
                        break;
                    case "advanced_def_debuff_Ex_" :
                        nextIdStr = "advanced_def_debuff_3rd_";
                        recNumber++;
                        break;
                    case "advanced_def_debuff_1st_" :
                        nextIdStr = "advanced_def_debuff_Ex_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "advanced_card_buff_2nd_" :
                        nextIdStr = "advanced_card_buff_1st_";
                        recNumber++;
                        break;
                    case "advanced_card_buff_3rd_" :
                        nextIdStr = "advanced_card_buff_2nd_";
                        recNumber++;
                        break;
                    case "advanced_card_buff_1st_" :
                        nextIdStr = "advanced_card_buff_3rd_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "advanced_card_debuff_2nd_" :
                        nextIdStr = "advanced_card_debuff_1st_";
                        recNumber++;
                        break;
                    case "advanced_card_debuff_3rd_" :
                        nextIdStr = "advanced_card_debuff_2nd_";
                        recNumber++;
                        break;
                    case "advanced_card_debuff_1st_" :
                        nextIdStr = "advanced_card_debuff_3rd_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "advanced_cri_buff_2nd_" :
                        nextIdStr = "advanced_cri_buff_1st_";
                        recNumber++;
                        break;
                    case "advanced_cri_buff_3rd_" :
                        nextIdStr = "advanced_cri_buff_2nd_";
                        recNumber++;
                        break;
                    case "advanced_cri_buff_1st_" :
                        nextIdStr = "advanced_cri_buff_3rd_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "advanced_supereffective_buff_2nd_" :
                        nextIdStr = "advanced_supereffective_buff_1st_";
                        recNumber++;
                        break;
                    case "advanced_supereffective_buff_3rd_" :
                        nextIdStr = "advanced_supereffective_buff_2nd_";
                        recNumber++;
                        break;
                    case "advanced_supereffective_buff_Ex_" :
                        nextIdStr = "advanced_supereffective_buff_3rd_";
                        recNumber++;
                        break;
                    case "advanced_supereffective_buff_1st_" :
                        nextIdStr = "advanced_supereffective_buff_Ex_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "advanced_fixed_dmg_2nd_" :
                        nextIdStr = "advanced_fixed_dmg_1st_";
                        recNumber++;
                        break;
                    case "advanced_fixed_dmg_3rd_" :
                        nextIdStr = "advanced_fixed_dmg_2nd_";
                        recNumber++;
                        break;
                    case "advanced_fixed_dmg_Ex_" :
                        nextIdStr = "advanced_fixed_dmg_3rd_";
                        recNumber++;
                        break;
                    case "advanced_fixed_dmg_1st_" :
                        nextIdStr = "advanced_fixed_dmg_Ex_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "advanced_special_def_2nd_" :
                        nextIdStr = "advanced_special_def_1st_";
                        recNumber++;
                        break;
                    case "advanced_special_def_3rd_" :
                        nextIdStr = "advanced_special_def_2nd_";
                        recNumber++;
                        break;
                    case "advanced_special_def_Ex_" :
                        nextIdStr = "advanced_special_def_3rd_";
                        recNumber++;
                        break;
                    case "advanced_special_def_1st_" :
                        nextIdStr = "advanced_special_def_Ex_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    default :
                        nextIdStr = activeIdStr;
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
               }
            }

            nextIdStr = nextIdStr + recNumber;
            nextObj = $("#" + nextIdStr);

            // フォーカス設定
            nextObj.focus();
        }  
    });

    /**
     * サーヴァント検索―クラス・レアリティ変更イベント
     */
    $(document).on("change", ".search_sarvant_select", function () {

        // サーヴァントセレクトボックスを再作成
        remakeSearchServantSelectBox();

        // サーヴァント情報表示
        servantInfo();

    });

    /**
     * サーヴァント検索―クラス・レアリティ変更イベント
     */
    $(document).on("change", ".servarnt-search-select", function () {

        // サーヴァントセレクトボックスを再作成
        remakeServantSelectBox();

    });

    /**
     * サーヴァント検索―サーヴァント名変更イベント
     */
    $(document).on("change", "#search_servant_name", function () {

        // サーヴァント情報表示
        servantInfo();

    });

    /**
     * サーヴァント検索―レベル変更イベント
     */
    $(document).on("change", "#search_servant_lvl", function () {

        // サーヴァント情報表示
        servantInfo();

    });

    /**
     * サーヴァント検索―宝具レベル変更イベント
     */
    $(document).on("change", "#search_servant_nplvl", function () {

        // サーヴァント情報表示
        servantInfo();

    });

    /**
     * サーヴァント検索―フォウ変更イベント
     */
    $(document).on("change", "#search_servant_fou", function () {

        // サーヴァント情報表示
        servantInfo();

    });

    /**
     * サーヴァント検索―礼装ATK変更イベント
     */
    $(document).on("change", "#search_servant_ceatk", function () {

        // サーヴァント情報表示
        servantInfo();

    });

    //サーヴァント情報を反映させる
    $(document).on("click", "#btn-apply", function() {

        if (servantApply()) {
            // NPスター計算
            calcRate();
            // サーヴァント情報を保持
            $("#np_star_servant_no_" + $("#prob_recNumber").val()).val($("#servant-name").val());
            $("#np_star_servant_class_" + $("#prob_recNumber").val()).val($("#servant-class").val());
            $("#np_star_servant_rare_" + $("#prob_recNumber").val()).val($("#servant-rare").val());
            // バフを保持
            $("#na_" + $("#prob_recNumber").val()).val($("#NA").val());
            $("#na_buff_" + $("#prob_recNumber").val()).val($("#NA_buff").val());
            $("#sr_" + $("#prob_recNumber").val()).val($("#SR").val());
            $("#sr_buff_" + $("#prob_recNumber").val()).val($("#SR_buff").val());
            $("#b_hit_" + $("#prob_recNumber").val()).val($("#b_hit").val());
            $("#a_hit_" + $("#prob_recNumber").val()).val($("#a_hit").val());
            $("#q_hit_" + $("#prob_recNumber").val()).val($("#q_hit").val());
            $("#ex_hit_" + $("#prob_recNumber").val()).val($("#ex_hit").val());
            $("#np_hit_" + $("#prob_recNumber").val()).val($("#np_hit").val());
            $("#na_enemy_" + $("#prob_recNumber").val()).val($("#NA_enemy").val());
            $("#sr_enemy_" + $("#prob_recNumber").val()).val($("#SR_enemy").val());
        }

        return false;

    });

    //開くボタンをクリックしたらモーダルを表示する
    $(document).on("click", ".search_link", function() {

        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

        // ドロップダウンメニューを閉じる
        $(".dropdown-menu").removeClass("show");

        // サーヴァント情報を復元
        if ($("#search_servant_no_" + recNumber).val() != "") {
            $("#search_servant_class").val($("#search_servant_class_" + recNumber).val());
            $("#search_servant_rare").val($("#search_servant_rare_" + recNumber).val());
            // サーヴァントセレクトボックスを再作成
            remakeSearchServantSelectBox();
            $("#search_servant_name").val($("#search_servant_no_" + recNumber).val());
            $("#search_servant_lvl").val($("#search_servant_lvl_" + recNumber).val());
            $("#search_servant_nplvl").val($("#search_servant_nplvl_" + recNumber).val());
            $("#search_servant_fou").val($("#search_servant_fou_" + recNumber).val());
            $("#search_servant_ceatk").val($("#search_servant_ce_" + recNumber).val());
        }

        // 行番号を保持
        $("#search_recNumber").val(recNumber);

        // サーヴァント情報表示
        servantInfo();

        return false;

    });

    /**
     * サーヴァント検索―選択押下イベント
     */
    $(document).on("click", "#btnSelected", function() {

        var recNumber = $("#search_recNumber").val();

        if ($("#servant-name").val() != null) {
            // 入力初期化
            clearParamTable(recNumber);

            $(servantList).each(function() {
                
                if ($("#search_servant_name").val() == this["No"]) {

                    var atk;

                    // サーヴァント画像変更
                    setServantImage(recNumber, this["No"]);

                    switch ($("#search_servant_lvl").val()) {
                        case "MAX" :
                            atk = Number(this["MaxAtk"]);
                            break;
                        case "100" :
                            atk = rounddown(Number(this["BaseAtk"]) 
                                + (Number(this["MaxAtk"]) - Number(this["BaseAtk"])) 
                                * Number(correctio_lv100[Number(this["レアリティ"])]),0);
                            break;
                        case "110" :
                            atk = rounddown(Number(this["BaseAtk"]) 
                                + (Number(this["MaxAtk"]) - Number(this["BaseAtk"])) 
                                * Number(correctio_lv110[Number(this["レアリティ"])]),0);
                            break;
                        case "120" :
                            atk = rounddown(Number(this["BaseAtk"]) 
                                + (Number(this["MaxAtk"]) - Number(this["BaseAtk"])) 
                                * Number(correctio_lv120[Number(this["レアリティ"])]),0);
                            break;
                        default :
                            break;
                    }

                    // ATK
                    $("#atk_" + recNumber).val(Number(atk) + Number($("#search_servant_fou").val()) + Number($("#search_servant_ceatk").val()));
                    // 宝具倍率
                    switch ($("#search_servant_nplvl").val()) {
                        case "1" :
                            $("#np_dmg_" + recNumber).val(this["宝具Lv1"]);
                            break;
                        case "2" :
                            $("#np_dmg_" + recNumber).val(this["宝具Lv2"]);
                            break;
                        case "3" :
                            $("#np_dmg_" + recNumber).val(this["宝具Lv3"]);
                            break;
                        case "4" :
                            $("#np_dmg_" + recNumber).val(this["宝具Lv4"]);
                            break;
                        case "5" :
                            $("#np_dmg_" + recNumber).val(this["宝具Lv5"]);
                            break;
                        default :
                            break;
                    }
                    // 宝具種類
                    $("#np_kind_" + recNumber).val(this["宝具カード"]);
                    // クラススキル_カード
                    if (this["クラススキル_Bバフ"] != "0"){
                        $("#b_card_buff_" + recNumber).val(this["クラススキル_Bバフ"]);
                    }
                    if (this["クラススキル_Aバフ"] != "0") {
                        $("#a_card_buff_" + recNumber).val(this["クラススキル_Aバフ"]);
                    }
                    if (this["クラススキル_Qバフ"] != "0") {
                        $("#q_card_buff_" + recNumber).val(this["クラススキル_Qバフ"]);
                    }
                    // クラススキル_クリティカル
                    if (this["クラススキル_クリバフ"] != "0") {
                        $("#cri_buff_" + recNumber).val(this["クラススキル_クリバフ"]);
                    }
                    if (this["クラススキル_Bクリバフ"] != "0") {
                        $("#b_card_cri_buff_" + recNumber).val(this["クラススキル_Bクリバフ"]);
                    }
                    if (this["クラススキル_Aクリバフ"] != "0") {
                        $("#a_card_cri_buff_" + recNumber).val(this["クラススキル_Aクリバフ"]);
                    }
                    if (this["クラススキル_Qクリバフ"] != "0") {
                        $("#q_card_cri_buff_" + recNumber).val(this["クラススキル_Qクリバフ"]);
                    }
                    // クラススキル_宝具
                    if (this["クラススキル_宝具バフ"] != "0") {
                        $("#np_buff_" + recNumber).val(this["クラススキル_宝具バフ"]);
                    }
                    // クラススキル_固定ダメージ
                    if (this["クラススキル_固定ダメージ"] != "0") {
                        $("#fixed_dmg_" + recNumber).val(this["クラススキル_固定ダメージ"]);
                    }
                    // クラス相性
                    switch (this["クラス"]) {
                        case "剣" :
                        case "騎" :
                            $("#class_affinity_" + recNumber).val("2.0");
                            $("#class_servant_" + recNumber).val("1.00");
                            break;
                        case "弓" :
                            $("#class_affinity_" + recNumber).val("2.0");
                            $("#class_servant_" + recNumber).val("0.95");
                            break;
                        case "槍" :
                            $("#class_affinity_" + recNumber).val("2.0");
                            $("#class_servant_" + recNumber).val("1.05");
                            break;
                        case "術" :
                        case "殺" :
                            $("#class_affinity_" + recNumber).val("2.0");
                            $("#class_servant_" + recNumber).val("0.90");
                            break;
                        case "狂" :
                            $("#class_affinity_" + recNumber).val("1.5");
                            $("#class_servant_" + recNumber).val("1.10");
                            break;
                        case "盾" :
                        case "月" :
                        case "降" :
                            $("#class_affinity_" + recNumber).val("1.0");
                            $("#class_servant_" + recNumber).val("1.00");
                            break;
                        case "裁" :
                        case "讐" :
                            $("#class_affinity_" + recNumber).val("1.0");
                            $("#class_servant_" + recNumber).val("1.10");
                            break;
                        case "分" :
                        case "詐" :
                        case "獣" :
                            $("#class_affinity_" + recNumber).val("1.5");
                            $("#class_servant_" + recNumber).val("1.00");
                            break;
                        default :
                            break;
                    }

                    $("#na_" + recNumber).val(this["N_N/A"]);
                    $("#na_buff_" + recNumber).val(this["クラススキル_NP獲得バフ"]);
                    $("#sr_" + recNumber).val(this["SR"]);
                    $("#sr_buff_" + recNumber).val(this["クラススキル_スター獲得バフ"]);
                    $("#b_hit_" + recNumber).val(this["BHIT"]);
                    $("#a_hit_" + recNumber).val(this["AHIT"]);
                    $("#q_hit_" + recNumber).val(this["QHIT"]);
                    $("#ex_hit_" + recNumber).val(this["EXHIT"]);
                    $("#np_hit_" + recNumber).val(this["宝具HIT"]);

                    // hidden
                    $("#search_servant_class_" + recNumber).val($("#search_servant_class").val());
                    $("#search_servant_rare_" + recNumber).val($("#search_servant_rare").val());
                    $("#search_servant_lvl_" + recNumber).val($("#search_servant_lvl").val());
                    $("#search_servant_nplvl_" + recNumber).val($("#search_servant_nplvl").val());
                    $("#search_servant_fou_" + recNumber).val($("#search_servant_fou").val());
                    $("#search_servant_ce_" + recNumber).val($("#search_servant_ceatk").val());
                    $("#search_servant_no_" + recNumber).val(this["No"]);

                    var caseClass;
                    switch (this["クラス"]) {
                        case "剣" :
                            caseClass = "Saber"
                            break;
                        case "弓" :
                            caseClass = "Archer"
                            break;
                        case "槍" :
                            caseClass = "Lancer"
                            break;
                        case "騎" :
                            caseClass = "Rider"
                            break;
                        case "術" :
                            caseClass = "Caster"
                            break;
                        case "殺" :
                            caseClass = "Assasin"
                            break;
                        case "狂" :
                            caseClass = "Berserker"
                            break;
                        case "裁" :
                        case "讐" :
                        case "月" :
                        case "盾" :
                            caseClass = "EX1"
                            break;
                        case "分" :
                        case "降" :
                        case "詐" :
                        case "獣" :
                            caseClass = "EX2"
                            break;
                        default :
                            break;
                    }

                    // クラススコア反映
                    $(classScoreDataList).each(function() {

                        if (this.class == caseClass) {
                            $("#b_card_power_buff_" + recNumber).val(BigNumber(parseFloat($("#b_card_power_buff_" + recNumber).val())).plus(parseFloat(this.b_card_power_buff)));
                            $("#a_card_power_buff_" + recNumber).val(BigNumber(parseFloat($("#a_card_power_buff_" + recNumber).val())).plus(parseFloat(this.a_card_power_buff)));
                            $("#q_card_power_buff_" + recNumber).val(BigNumber(parseFloat($("#q_card_power_buff_" + recNumber).val())).plus(parseFloat(this.q_card_power_buff)));
                            $("#cri_buff_" + recNumber).val(BigNumber(parseFloat($("#cri_buff_" + recNumber).val())).plus(parseFloat(this.cri_buff)));
                            $("#b_card_cri_buff_" + recNumber).val(BigNumber(parseFloat($("#b_card_cri_buff_" + recNumber).val())).plus(parseFloat(this.b_card_cri_buff)));
                            $("#a_card_cri_buff_" + recNumber).val(BigNumber(parseFloat($("#a_card_cri_buff_" + recNumber).val())).plus(parseFloat(this.a_card_cri_buff)));
                            $("#q_card_cri_buff_" + recNumber).val(BigNumber(parseFloat($("#q_card_cri_buff_" + recNumber).val())).plus(parseFloat(this.q_card_cri_buff)));
                            $("#np_buff_" + recNumber).val(BigNumber(parseFloat($("#np_buff_" + recNumber).val())).plus(parseFloat(this.np_buff)));
                            $("#ex_atk_buff_" + recNumber).val(BigNumber(parseFloat($("#ex_atk_buff_" + recNumber).val())).plus(parseFloat(this.ex_atk_buff)));
                            $("#sr_buff_" + recNumber).val(BigNumber(parseFloat($("#sr_buff_" + recNumber).val())).plus(parseFloat(this.sr_buff)));

                            return;
                        }

                    });

                    return;

                }

            });

        }

        // 再計算
        calcMain(recNumber)
        
        return true;

    });

    //開くボタンをクリックしたらモーダルを表示する
    $(document).on("click", ".buffPreset_link", function() {

        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

        // ドロップダウンメニューを閉じる
        $(".dropdown-menu").removeClass("show");

        // 行番号を保持
        $("#buffPreset_recNumber").val(recNumber);

        return false;

    });

    //開くボタンをクリックしたらモーダルを表示する
    $(document).on("click", "#goBuffPreset", function() {

        // ドロップダウンメニューを閉じる
        $(".dropdown-menu").removeClass("show");

        return false;

    });

    /**
     * バフプリセットフォーカス遷移イベント
     */
    $("#buffPresetSelTable").on("blur", "input", function () {

        if (this.id == "name_buffPreset_sel") {
            return;
        }

        // ブランクなら0を入れる
        if (this.value == "") {
            this.value = "0";
        }

        // 数値変換
        this.value = parseFloat(this.value);

    });

    /**
     * バフプリセットフォーカス遷移イベント
     */
    $("#buffPresetTable").on("blur", "input", function () {

        if (this.id == "name_buffPreset_inp") {
            return;
        }

        // ブランクなら0を入れる
        if (this.value == "") {
            this.value = "0";
        }

        // 数値変換
        this.value = parseFloat(this.value);

    });

    /**
     * バフプリセットフォーカス遷移イベント
     */
    $("#buffPresetUpdTable").on("blur", "input", function () {

        if (this.id == "name_buffPreset_upd_del") {
            return;
        }

        // ブランクなら0を入れる
        if (this.value == "") {
            this.value = "0";
        }

        // 数値変換
        this.value = parseFloat(this.value);

    });

    /**
     * バフプリセット―タブ遷移イベント(登録)
     */
    $("#nav-buffPreset-regist").on("shown.bs.tab", function () {
        
        $("#btnbuffPreset_regist").removeClass("d-none");
        $("#btnbuffPreset_del").addClass("d-none");
        $("#btnbuffPreset_upd").addClass("d-none");
        
    });

    /**
     * バフプリセット―タブ遷移イベント(更新・削除)
     */
    $("#nav-buffPreset-upd-del").on("shown.bs.tab", function () {
        
        $("#btnbuffPreset_regist").addClass("d-none");
        $("#btnbuffPreset_del").removeClass("d-none");
        $("#btnbuffPreset_upd").removeClass("d-none");
        
    });

    /**
     * バフプリセット―登録押下イベント
     */
    $(document).on("click", "#btnbuffPreset_regist", function() {

        let date = new Date()
        let now = date.toLocaleDateString("ja-JP", {year: "numeric",month: "2-digit",day: "2-digit",hour: "2-digit",minute: "2-digit",second: "2-digit"}).replaceAll("/", "").replaceAll(":", "").replaceAll(/\s+/g, "") + date.getMilliseconds();
        let name = $("#name_buffPreset_inp").val();

        if (name == "") { name = "プリセット名無し";}

        let json = {
            "id": now
            , "name": name
            , "atk_buff" : $("#atk_buff_buffPreset_inp").val()
            , "def_debuff" : $("#def_debuff_buffPreset_inp").val()
            , "b_card_buff" : $("#b_card_buff_buffPreset_inp").val()
            , "a_card_buff" : $("#a_card_buff_buffPreset_inp").val()
            , "q_card_buff" : $("#q_card_buff_buffPreset_inp").val()
            , "b_card_debuff" : $("#b_card_debuff_buffPreset_inp").val()
            , "a_card_debuff" : $("#a_card_debuff_buffPreset_inp").val()
            , "q_card_debuff" : $("#q_card_debuff_buffPreset_inp").val()
            , "b_card_power_buff" : $("#b_card_power_buff_buffPreset_inp").val()
            , "a_card_power_buff" : $("#a_card_power_buff_buffPreset_inp").val()
            , "q_card_power_buff" : $("#q_card_power_buff_buffPreset_inp").val()
            , "cri_buff" : $("#cri_buff_buffPreset_inp").val()
            , "b_card_cri_buff" : $("#b_card_cri_buff_buffPreset_inp").val()
            , "a_card_cri_buff" : $("#a_card_cri_buff_buffPreset_inp").val()
            , "q_card_cri_buff" : $("#q_card_cri_buff_buffPreset_inp").val()
            , "np_buff" : $("#np_buff_buffPreset_inp").val()
            , "ex_atk_buff" : $("#ex_atk_buff_buffPreset_inp").val()
            , "supereffective_buff" : $("#supereffective_buff_buffPreset_inp").val()
            , "fixed_dmg" : $("#fixed_dmg_buffPreset_inp").val()
            , "na_buff" : $("#na_buff_buffPreset_inp").val()
            , "sr_buff" : $("#sr_buff_buffPreset_inp").val()
            , "dream_end" : $("#dream_end_buffPreset_inp")[0].checked
            , "pin_flag" : $("#pin_flag_inp")[0].checked
        };

        buffPresetDataList.push(json);

        // ローカルストレージに格納
        if (window.localStorage) {
            localStorage.setItem(localStorageKey_BuffPreset, JSON.stringify(buffPresetDataList));
        }

        // プリセットセレクトボックス作成
        remakePresetSelectBox();

        // プリセットデータ設定
        setPresetDataUpdDel($("#buffPreset_name").val());
        setPresetDataSel($("#buffPreset_sel_name").val());

        // ピン留め作成
        pinBuffCreate();

        // 初期値を設定
        $("#name_buffPreset_inp").val("");
        $("#atk_buff_buffPreset_inp").val("0");
        $("#def_debuff_buffPreset_inp").val("0");
        $("#b_card_buff_buffPreset_inp").val("0");
        $("#a_card_buff_buffPreset_inp").val("0");
        $("#q_card_buff_buffPreset_inp").val("0");
        $("#b_card_debuff_buffPreset_inp").val("0");
        $("#a_card_debuff_buffPreset_inp").val("0");
        $("#q_card_debuff_buffPreset_inp").val("0");
        $("#b_card_power_buff_buffPreset_inp").val("0");
        $("#a_card_power_buff_buffPreset_inp").val("0");
        $("#q_card_power_buff_buffPreset_inp").val("0");
        $("#cri_buff_buffPreset_inp").val("0");
        $("#b_card_cri_buff_buffPreset_inp").val("0");
        $("#a_card_cri_buff_buffPreset_inp").val("0");
        $("#q_card_cri_buff_buffPreset_inp").val("0");
        $("#np_buff_buffPreset_inp").val("0");
        $("#ex_atk_buff_buffPreset_inp").val("0");
        $("#supereffective_buff_buffPreset_inp").val("0");
        $("#fixed_dmg_buffPreset_inp").val("0");
        $("#na_buff_buffPreset_inp").val("0");
        $("#sr_buff_buffPreset_inp").val("0");
        $("#dream_end_buffPreset_inp")[0].checked = false;
        $("#pin_flag_inp")[0].checked = false;
        
        return true;

    });

    /**
     * セレクトボックス変更イベント
     */
    $(document).on("change", "#buffPreset_name", function () {

        // プリセットデータ設定
        setPresetDataUpdDel($("#buffPreset_name").val());

    });

    /**
     * セレクトボックス変更イベント
     */
    $(document).on("change", "#buffPreset_sel_name", function () {

        // プリセットデータ設定
        setPresetDataSel($("#buffPreset_sel_name").val());

    });

    /**
     * バフプリセット―更新押下イベント
     */
    $(document).on("click", "#btnbuffPreset_upd", function() {

        let id = $("#buffPreset_name").val();

        $(buffPresetDataList).each(function() {

            if (this.id == id) {
                // リストを更新
                this.name = $("#name_buffPreset_upd_del").val();
                this.atk_buff = $("#atk_buff_buffPreset_upd_del").val();
                this.def_debuff = $("#def_debuff_buffPreset_upd_del").val();
                this.b_card_buff = $("#b_card_buff_buffPreset_upd_del").val();
                this.a_card_buff = $("#a_card_buff_buffPreset_upd_del").val();
                this.q_card_buff = $("#q_card_buff_buffPreset_upd_del").val();
                this.b_card_debuff = $("#b_card_debuff_buffPreset_upd_del").val();
                this.a_card_debuff = $("#a_card_debuff_buffPreset_upd_del").val();
                this.q_card_debuff = $("#q_card_debuff_buffPreset_upd_del").val();
                this.b_card_power_buff = $("#b_card_power_buff_buffPreset_upd_del").val();
                this.a_card_power_buff = $("#a_card_power_buff_buffPreset_upd_del").val();
                this.q_card_power_buff = $("#q_card_power_buff_buffPreset_upd_del").val();
                this.cri_buff = $("#cri_buff_buffPreset_upd_del").val();
                this.b_card_cri_buff = $("#b_card_cri_buff_buffPreset_upd_del").val();
                this.a_card_cri_buff = $("#a_card_cri_buff_buffPreset_upd_del").val();
                this.q_card_cri_buff = $("#q_card_cri_buff_buffPreset_upd_del").val();
                this.np_buff = $("#np_buff_buffPreset_upd_del").val();
                this.ex_atk_buff = $("#ex_atk_buff_buffPreset_upd_del").val();
                this.supereffective_buff = $("#supereffective_buff_buffPreset_upd_del").val();
                this.fixed_dmg = $("#fixed_dmg_buffPreset_upd_del").val();
                this.na_buff = $("#na_buff_buffPreset_upd_del").val();
                this.sr_buff = $("#sr_buff_buffPreset_upd_del").val();
                this.dream_end = $("#dream_end_buffPreset_upd_del")[0].checked;
                this.pin_flag = $("#pin_flag_upd_del")[0].checked;

                // プリセットセレクトボックス作成
                remakePresetSelectBox();

                // プリセットデータ設定
                setPresetDataSel($("#buffPreset_sel_name").val());

                // ピン留め作成
                pinBuffCreate();

                // セレクトボックスのプリセット名を変更
                $("#buffPreset_name").val(this.id);

                // ローカルストレージに格納
                if (window.localStorage) {
                    localStorage.setItem(localStorageKey_BuffPreset, JSON.stringify(buffPresetDataList));
                }
    
                return;
            }
    
        });

    });

    /**
     * バフプリセット―削除押下イベント
     */
    $(document).on("click", "#btnbuffPreset_del", function() {

        let id = $("#buffPreset_name").val();

        buffPresetDataList = buffPresetDataList.filter((preset) => {
            return (preset.id != id);
        });

        // プリセットセレクトボックス作成
        remakePresetSelectBox();

        // プリセットデータ設定
        setPresetDataUpdDel($("#buffPreset_name").val());
        setPresetDataSel($("#buffPreset_sel_name").val());

        // ピン留め作成
        pinBuffCreate();

        // ローカルストレージに格納
        if (window.localStorage) {
            localStorage.setItem(localStorageKey_BuffPreset, JSON.stringify(buffPresetDataList));
        }

    });

    /**
     * バフプリセット―適用押下イベント
     */
    $(document).on("click", "#btnbuffPreset_apply", function() {

        var recNumber = $("#buffPreset_recNumber").val();

        if ($("#buffPreset_name").val() == null){
            return;
        }

        $("#atk_buff_" + recNumber).val(BigNumber(parseFloat($("#atk_buff_" + recNumber).val())).plus(parseFloat($("#atk_buff_buffPreset_sel").val())));
        $("#def_debuff_" + recNumber).val(BigNumber(parseFloat($("#def_debuff_" + recNumber).val())).plus(parseFloat($("#def_debuff_buffPreset_sel").val())));
        $("#b_card_buff_" + recNumber).val(BigNumber(parseFloat($("#b_card_buff_" + recNumber).val())).plus(parseFloat($("#b_card_buff_buffPreset_sel").val())));
        $("#b_card_debuff_" + recNumber).val(BigNumber(parseFloat($("#b_card_debuff_" + recNumber).val())).plus(parseFloat($("#b_card_debuff_buffPreset_sel").val())));
        $("#b_card_power_buff_" + recNumber).val(BigNumber(parseFloat($("#b_card_power_buff_" + recNumber).val())).plus(parseFloat($("#b_card_power_buff_buffPreset_sel").val())));
        $("#b_card_cri_buff_" + recNumber).val(BigNumber(parseFloat($("#b_card_cri_buff_" + recNumber).val())).plus(parseFloat($("#b_card_cri_buff_buffPreset_sel").val())));
        $("#a_card_buff_" + recNumber).val(BigNumber(parseFloat($("#a_card_buff_" + recNumber).val())).plus(parseFloat($("#a_card_buff_buffPreset_sel").val())));
        $("#a_card_debuff_" + recNumber).val(BigNumber(parseFloat($("#a_card_debuff_" + recNumber).val())).plus(parseFloat($("#a_card_debuff_buffPreset_sel").val())));
        $("#a_card_power_buff_" + recNumber).val(BigNumber(parseFloat($("#a_card_power_buff_" + recNumber).val())).plus(parseFloat($("#a_card_power_buff_buffPreset_sel").val())));
        $("#a_card_cri_buff_" + recNumber).val(BigNumber(parseFloat($("#a_card_cri_buff_" + recNumber).val())).plus(parseFloat($("#a_card_cri_buff_buffPreset_sel").val())));
        $("#q_card_buff_" + recNumber).val(BigNumber(parseFloat($("#q_card_buff_" + recNumber).val())).plus(parseFloat($("#q_card_buff_buffPreset_sel").val())));
        $("#q_card_debuff_" + recNumber).val(BigNumber(parseFloat($("#q_card_debuff_" + recNumber).val())).plus(parseFloat($("#q_card_debuff_buffPreset_sel").val())));
        $("#q_card_power_buff_" + recNumber).val(BigNumber(parseFloat($("#q_card_power_buff_" + recNumber).val())).plus(parseFloat($("#q_card_power_buff_buffPreset_sel").val())));
        $("#q_card_cri_buff_" + recNumber).val(BigNumber(parseFloat($("#q_card_cri_buff_" + recNumber).val())).plus(parseFloat($("#q_card_cri_buff_buffPreset_sel").val())));
        $("#cri_buff_" + recNumber).val(BigNumber(parseFloat($("#cri_buff_" + recNumber).val())).plus(parseFloat($("#cri_buff_buffPreset_sel").val())));
        $("#np_buff_" + recNumber).val(BigNumber(parseFloat($("#np_buff_" + recNumber).val())).plus(parseFloat($("#np_buff_buffPreset_sel").val())));
        $("#ex_atk_buff_" + recNumber).val(BigNumber(parseFloat($("#ex_atk_buff_" + recNumber).val())).plus(parseFloat($("#ex_atk_buff_buffPreset_sel").val())));
        $("#supereffective_buff_" + recNumber).val(BigNumber(parseFloat($("#supereffective_buff_" + recNumber).val())).plus(parseFloat($("#supereffective_buff_buffPreset_sel").val())));
        $("#fixed_dmg_" + recNumber).val(BigNumber(parseFloat($("#fixed_dmg_" + recNumber).val())).plus(parseFloat($("#fixed_dmg_buffPreset_sel").val())));
        $("#na_buff_" + recNumber).val(BigNumber(parseFloat($("#na_buff_" + recNumber).val())).plus(parseFloat($("#na_buff_buffPreset_sel").val())));
        $("#sr_buff_" + recNumber).val(BigNumber(parseFloat($("#sr_buff_" + recNumber).val())).plus(parseFloat($("#sr_buff_buffPreset_sel").val())));

        if ($("#dream_end_buffPreset_sel")[0].checked) {
            $("#np_buff_" + recNumber).val(parseFloat($("#np_buff_" + recNumber).val()) * 2);
        }

        // 再計算
        calcMain(recNumber);

    }); 
    
    /**
     * ピン留めバフ押下イベント
     */
    $(document).on("click", ".pin_buff_link", function() {

        var recNumber = this.dataset.targetrec;
        var presetId = this.dataset.presetid;

        // ドロップダウンメニューを閉じる
        $(".dropdown-menu").removeClass("show");

        $(buffPresetDataList).each(function() {

            if (this.id == presetId) {

                $("#atk_buff_" + recNumber).val(BigNumber(parseFloat($("#atk_buff_" + recNumber).val())).plus(parseFloat(this.atk_buff)));
                $("#def_debuff_" + recNumber).val(BigNumber(parseFloat($("#def_debuff_" + recNumber).val())).plus(parseFloat(this.def_debuff)));
                $("#b_card_buff_" + recNumber).val(BigNumber(parseFloat($("#b_card_buff_" + recNumber).val())).plus(parseFloat(this.b_card_buff)));
                $("#b_card_debuff_" + recNumber).val(BigNumber(parseFloat($("#b_card_debuff_" + recNumber).val())).plus(parseFloat(this.b_card_debuff)));
                $("#b_card_power_buff_" + recNumber).val(BigNumber(parseFloat($("#b_card_power_buff_" + recNumber).val())).plus(parseFloat(this.b_card_power_buff)));
                $("#b_card_cri_buff_" + recNumber).val(BigNumber(parseFloat($("#b_card_cri_buff_" + recNumber).val())).plus(parseFloat(this.b_card_cri_buff)));
                $("#a_card_buff_" + recNumber).val(BigNumber(parseFloat($("#a_card_buff_" + recNumber).val())).plus(parseFloat(this.a_card_buff)));
                $("#a_card_debuff_" + recNumber).val(BigNumber(parseFloat($("#a_card_debuff_" + recNumber).val())).plus(parseFloat(this.a_card_debuff)));
                $("#a_card_power_buff_" + recNumber).val(BigNumber(parseFloat($("#a_card_power_buff_" + recNumber).val())).plus(parseFloat(this.a_card_power_buff)));
                $("#a_card_cri_buff_" + recNumber).val(BigNumber(parseFloat($("#a_card_cri_buff_" + recNumber).val())).plus(parseFloat(this.a_card_cri_buff)));
                $("#q_card_buff_" + recNumber).val(BigNumber(parseFloat($("#q_card_buff_" + recNumber).val())).plus(parseFloat(this.q_card_buff)));
                $("#q_card_debuff_" + recNumber).val(BigNumber(parseFloat($("#q_card_debuff_" + recNumber).val())).plus(parseFloat(this.q_card_debuff)));
                $("#q_card_power_buff_" + recNumber).val(BigNumber(parseFloat($("#q_card_power_buff_" + recNumber).val())).plus(parseFloat(this.q_card_power_buff)));
                $("#q_card_cri_buff_" + recNumber).val(BigNumber(parseFloat($("#q_card_cri_buff_" + recNumber).val())).plus(parseFloat(this.q_card_cri_buff)));
                $("#cri_buff_" + recNumber).val(BigNumber(parseFloat($("#cri_buff_" + recNumber).val())).plus(parseFloat(this.cri_buff)));
                $("#np_buff_" + recNumber).val(BigNumber(parseFloat($("#np_buff_" + recNumber).val())).plus(parseFloat(this.np_buff)));
                $("#ex_atk_buff_" + recNumber).val(BigNumber(parseFloat($("#ex_atk_buff_" + recNumber).val())).plus(parseFloat(this.ex_atk_buff)));
                $("#supereffective_buff_" + recNumber).val(BigNumber(parseFloat($("#supereffective_buff_" + recNumber).val())).plus(parseFloat(this.supereffective_buff)));
                $("#fixed_dmg_" + recNumber).val(BigNumber(parseFloat($("#fixed_dmg_" + recNumber).val())).plus(parseFloat(this.fixed_dmg)));
                $("#na_buff_" + recNumber).val(BigNumber(parseFloat($("#na_buff_" + recNumber).val())).plus(parseFloat(this.na_buff)));
                $("#sr_buff_" + recNumber).val(BigNumber(parseFloat($("#sr_buff_" + recNumber).val())).plus(parseFloat(this.sr_buff)));
        
                if (this.dream_end) {
                    $("#np_buff_" + recNumber).val(parseFloat($("#np_buff_" + recNumber).val()) * 2);
                }

                return;

            }
    
        });

        // 再計算
        calcMain(recNumber);

        return false;

    });

    /**
     * クラススコアフォーカス遷移イベント
     */
    $(".classScoreTable").on("blur", "input", function () {

        // ブランクなら0を入れる
        if (this.value == "") {
            this.value = "0";
        }

        // 数値変換
        this.value = parseFloat(this.value);

    });

    /**
     * クラススコア―登録押下イベント
     */
    $(document).on("click", "#btnClassScore_regist", function() {

        classScoreDataList = [];

        for (const className of classScore_class) {

            let json = {
                "class": className
                , "b_card_power_buff" : $("#b_card_power_buff_classScore_" + className).val()
                , "a_card_power_buff" : $("#a_card_power_buff_classScore_" + className).val()
                , "q_card_power_buff" : $("#q_card_power_buff_classScore_" + className).val()
                , "cri_buff" : $("#cri_buff_classScore_" + className).val()
                , "b_card_cri_buff" : $("#b_card_cri_buff_classScore_" + className).val()
                , "a_card_cri_buff" : $("#a_card_cri_buff_classScore_" + className).val()
                , "q_card_cri_buff" : $("#q_card_cri_buff_classScore_" + className).val()
                , "np_buff" : $("#np_buff_classScore_" + className).val()
                , "ex_atk_buff" : $("#ex_atk_buff_classScore_" + className).val()
                , "sr_buff" : $("#sr_buff_classScore_" + className).val()
            };

            classScoreDataList.push(json);

        }        

        // ローカルストレージに格納
        if (window.localStorage) {
            localStorage.setItem(localStorageKey_ClassScore, JSON.stringify(classScoreDataList));
        }
        
        return true;

    });
    
    // CSVの読み込み
    $.get("https://fategoplayer2.github.io/fgodamagecalculator/data/servant_data.csv", parseCsv, "text");

});

/**
 * CSV読込
 * @param data csvパス
 */
function parseCsv(data) {
    // CSVを配列で読み込む
    var csv = $.csv.toArrays(data);

    servantList = new Array();

    $(csv).each(function() {
        
        var option = document.createElement("option");  
        var servant = {};

        servant["No"] = this[0];
        servant["サーヴァント名"] = this[1];
        servant["クラス"] = this[2];
        servant["レアリティ"] = this[3];
        servant["BaseHP"] = this[4];
        servant["MaxHP"] = this[5];
        servant["BaseAtk"] = this[6];
        servant["MaxAtk"] = this[7];
        servant["天地人"] = this[8];
        servant["B_N/A"] = this[9];
        servant["A_N/A"] = this[10];
        servant["Q_N/A"] = this[11];
        servant["EX_N/A"] = this[12];
        servant["N_N/A"] = this[13];
        servant["N/D"] = this[14];
        servant["SR"] = this[15];
        servant["SW"] = this[16];
        servant["DR"] = this[17];
        servant["BHIT"] = this[18];
        servant["AHIT"] = this[19];
        servant["QHIT"] = this[20];
        servant["EXHIT"] = this[21];
        servant["宝具HIT"] = this[22];
        servant["カード"] = this[23];
        servant["宝具カード"] = this[24];
        servant["宝具タイプ"] = this[25];
        servant["宝具Lv1"] = this[26];
        servant["宝具Lv2"] = this[27];
        servant["宝具Lv3"] = this[28];
        servant["宝具Lv4"] = this[29];
        servant["宝具Lv5"] = this[30];
        servant["クラススキル_固定ダメージ"] = this[31];
        servant["クラススキル_Bバフ"] = this[32];
        servant["クラススキル_Aバフ"] = this[33];
        servant["クラススキル_Qバフ"] = this[34];
        servant["クラススキル_宝具バフ"] = this[35];
        servant["クラススキル_クリバフ"] = this[36];
        servant["クラススキル_Bクリバフ"] = this[37];
        servant["クラススキル_Aクリバフ"] = this[38];
        servant["クラススキル_Qクリバフ"] = this[39];
        servant["クラススキル_NP獲得バフ"] = this[40];
        servant["クラススキル_NP獲得Bバフ"] = this[41];
        servant["クラススキル_NP獲得Aバフ"] = this[42];
        servant["クラススキル_NP獲得Qバフ"] = this[43];
        servant["クラススキル_NP獲得被ダメ"] = this[44];
        servant["クラススキル_スター獲得バフ"] = this[45];
        servant["クラススキル_スター獲得Bバフ"] = this[46];
        servant["クラススキル_スター獲得Aバフ"] = this[47];
        servant["クラススキル_スター獲得Qバフ"] = this[48];
        servant["性別"] = this[49];
        servant["属性"] = this[50];
        servant["性格"] = this[51];
        servant["特性"] = this[52];
        servant["宝具名"] = this[53];
        servant["宝具効果"] = this[54].replaceAll("\\n","\n");
        servant["スキル1名"] = this[55];
        servant["スキル1CT"] = this[56];
        servant["スキル1効果"] = this[57].replaceAll("\\n","\n");
        servant["スキル2名"] = this[58];
        servant["スキル2CT"] = this[59];
        servant["スキル2効果"] = this[60].replaceAll("\\n","\n");
        servant["スキル3名"] = this[61];
        servant["スキル3CT"] = this[62];
        servant["スキル3効果"] = this[63].replaceAll("\\n","\n");
        servant["クラススキル1名"] = this[64];
        servant["クラススキル1効果"] = this[65].replaceAll("\\n","\n");
        servant["クラススキル2名"] = this[66];
        servant["クラススキル2効果"] = this[67].replaceAll("\\n","\n");
        servant["クラススキル3名"] = this[68];
        servant["クラススキル3効果"] = this[69].replaceAll("\\n","\n");
        servant["クラススキル4名"] = this[70];
        servant["クラススキル4効果"] = this[71].replaceAll("\\n","\n");
        servant["クラススキル5名"] = this[72];
        servant["クラススキル5効果"] = this[73].replaceAll("\\n","\n");
        servant["クラススキル6名"] = this[74];
        servant["クラススキル6効果"] = this[75].replaceAll("\\n","\n");
        servant["クラススキル7名"] = this[76];
        servant["クラススキル7効果"] = this[77].replaceAll("\\n","\n");
        servant["アペンド名"] = this[78];
        servant["アペンド効果"] = this[79];
        servant["絆礼装効果"] = this[80].replaceAll("\\n","\n");
        
        servantList.push(servant);

        option.value = servant["No"];
        option.textContent = servant["サーヴァント名"];
        $("#servant-name")[0].appendChild(option);

    });

    // サーヴァントセレクトボックスを作成
    remakeSearchServantSelectBox();
    remakeServantSelectBox();
    
}

/**
 * サーヴァント検索画面セレクトボックス再作成
 */
function remakeSearchServantSelectBox() {
    let className = $("#search_servant_class").val();
    let rarity = $("#search_servant_rare").val();

    if (className != "" || rarity != "") {
        // サーヴァントセレクトボックスを削除
        while ($("#search_servant_name")[0].lastChild) {
            $("#search_servant_name")[0].removeChild($("#search_servant_name")[0].lastChild);
        }

        // 指定されたクラスのみで再作成
        $(servantList).each(function() {
            var option = document.createElement("option");

            if (className != "" && rarity != "") {
                if (this["クラス"] == className && this["レアリティ"] == rarity) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#search_servant_name")[0].appendChild(option);
                }
            }
            else if (className != "" && rarity == "") {
                if (this["クラス"] == className) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#search_servant_name")[0].appendChild(option);
                }
            }
            else if (className == "" && rarity != "") {
                if (this["レアリティ"] == rarity) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#search_servant_name")[0].appendChild(option);
                }
            }

        });
    }
    else {

        // サーヴァントセレクトボックスを削除
        while ($("#search_servant_name")[0].lastChild) {
            $("#search_servant_name")[0].removeChild($("#search_servant_name")[0].lastChild);
        }

        // 全てのサーヴァントで再作成
        $(servantList).each(function() {
            var option = document.createElement("option");  
            option.value = this["No"];
            option.textContent = this["サーヴァント名"];
            $("#search_servant_name")[0].appendChild(option);
        });

    }
}

/**
 * サーヴァントセレクトボックス再作成
 */
function remakeServantSelectBox() {
    let className = $("#servant-class").val();
    let rarity = $("#servant-rare").val();

    if (className != "" || rarity != "") {
        // サーヴァントセレクトボックスを削除
        while ($("#servant-name")[0].lastChild) {
            $("#servant-name")[0].removeChild($("#servant-name")[0].lastChild);
        }

        // 指定されたクラスのみで再作成
        $(servantList).each(function() {
            var option = document.createElement("option");

            if (className != "" && rarity != "") {
                if (this["クラス"] == className && this["レアリティ"] == rarity) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#servant-name")[0].appendChild(option);
                }
            }
            else if (className != "" && rarity == "") {
                if (this["クラス"] == className) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#servant-name")[0].appendChild(option);
                }
            }
            else if (className == "" && rarity != "") {
                if (this["レアリティ"] == rarity) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#servant-name")[0].appendChild(option);
                }
            }

        });
    }
    else {

        // サーヴァントセレクトボックスを削除
        while ($("#servant-name")[0].lastChild) {
            $("#servant-name")[0].removeChild($("#servant-name")[0].lastChild);
        }

        // 全てのサーヴァントで再作成
        $(servantList).each(function() {
            var option = document.createElement("option");  
            option.value = this["No"];
            option.textContent = this["サーヴァント名"];
            $("#servant-name")[0].appendChild(option);
        });

    }
}

/**
 * パラメーター初期化
 * @param row 行番号
 */
function clearParam(row) {

    $("#memo_" + row).val("");
    $("#atk_" + row).val("0");
    $("#np_dmg_" + row).val("500");
    $("#np_kind_" + row).val("B");
    $("#atk_buff_" + row).val("0");
    $("#def_debuff_" + row).val("0");
    $("#b_card_buff_" + row).val("0");
    $("#b_card_debuff_" + row).val("0");
    $("#b_card_power_buff_" + row).val("0");
    $("#b_card_cri_buff_" + row).val("0");
    $("#a_card_buff_" + row).val("0");
    $("#a_card_debuff_" + row).val("0");
    $("#a_card_power_buff_" + row).val("0");
    $("#a_card_cri_buff_" + row).val("0");
    $("#q_card_buff_" + row).val("0");
    $("#q_card_debuff_" + row).val("0");
    $("#q_card_power_buff_" + row).val("0");
    $("#q_card_cri_buff_" + row).val("0");
    $("#cri_buff_" + row).val("0");
    $("#np_buff_" + row).val("0");
    $("#ex_atk_buff_" + row).val("0");
    $("#supereffective_buff_" + row).val("0");
    $("#supereffective_np_" + row).val("100");
    $("#fixed_dmg_" + row).val("0");
    $("#b_footprints_" + row).val("0");
    $("#a_footprints_" + row).val("0");
    $("#q_footprints_" + row).val("0");
    $("#special_def_" + row).val("0");
    $("#advanced_atk_buff_1st_" + row).val("0");
    $("#advanced_atk_buff_2nd_" + row).val("0");
    $("#advanced_atk_buff_3rd_" + row).val("0");
    $("#advanced_atk_buff_Ex_" + row).val("0");
    $("#advanced_def_debuff_1st_" + row).val("0");
    $("#advanced_def_debuff_2nd_" + row).val("0");
    $("#advanced_def_debuff_3rd_" + row).val("0");
    $("#advanced_def_debuff_Ex_" + row).val("0");
    $("#advanced_card_buff_1st_" + row).val("0");
    $("#advanced_card_buff_2nd_" + row).val("0");
    $("#advanced_card_buff_3rd_" + row).val("0");
    $("#advanced_card_debuff_1st_" + row).val("0");
    $("#advanced_card_debuff_2nd_" + row).val("0");
    $("#advanced_card_debuff_3rd_" + row).val("0");
    $("#advanced_cri_buff_1st_" + row).val("0");
    $("#advanced_cri_buff_2nd_" + row).val("0");
    $("#advanced_cri_buff_3rd_" + row).val("0");
    $("#advanced_supereffective_buff_1st_" + row).val("0");
    $("#advanced_supereffective_buff_2nd_" + row).val("0");
    $("#advanced_supereffective_buff_3rd_" + row).val("0");
    $("#advanced_supereffective_buff_Ex_" + row).val("0");
    $("#advanced_fixed_dmg_1st_" + row).val("0");
    $("#advanced_fixed_dmg_2nd_" + row).val("0");
    $("#advanced_fixed_dmg_3rd_" + row).val("0");
    $("#advanced_fixed_dmg_Ex_" + row).val("0");
    $("#advanced_special_def_1st_" + row).val("0");
    $("#advanced_special_def_2nd_" + row).val("0");
    $("#advanced_special_def_3rd_" + row).val("0");
    $("#advanced_special_def_Ex_" + row).val("0");
    $("#class_affinity_" + row).val("2.0");
    $("#attribute_affinity_" + row).val("1.0");
    $("#class_servant_" + row).val("1.00");
    $("#card_1st_" + row).val("NP");
    $("#card_1st_cri_" + row).val("Y");
    $("#card_2nd_" + row).val("B");
    $("#card_2nd_cri_" + row).val("Y");
    $("#card_3rd_" + row).val("B");
    $("#card_3rd_cri_" + row).val("Y");
    $("#ex_cri_" + row).val("Y");
    $("#dmg_min_1st_" + row).val("0");
    $("#dmg_ave_1st_" + row).val("0");
    $("#dmg_max_1st_" + row).val("0");
    $("#dmg_min_2nd_" + row).val("0");
    $("#dmg_ave_2nd_" + row).val("0");
    $("#dmg_max_2nd_" + row).val("0");
    $("#dmg_min_3rd_" + row).val("0");
    $("#dmg_ave_3rd_" + row).val("0");
    $("#dmg_max_3rd_" + row).val("0");
    $("#dmg_min_ex_" + row).val("0");
    $("#dmg_ave_ex_" + row).val("0");
    $("#dmg_max_ex_" + row).val("0");
    $("#dmg_min_total_" + row).val("0");
    $("#dmg_ave_total_" + row).val("0");
    $("#dmg_max_total_" + row).val("0");

    $("#search_servant_no_" + row).val("");
    $("#search_servant_class_" + row).val("");
    $("#search_servant_rare_" + row).val("");
    $("#search_servant_lvl_" + row).val("");
    $("#search_servant_nplvl_" + row).val("");
    $("#search_servant_fou_" + row).val("");
    $("#search_servant_ce_" + row).val("");
    
    $("#prob_hp_" + row).val("0");
    $("#enemy_hp").val("0");
    $("#prob_recNumber").val("");

    $("#np_star_servant_no_" + row).val("");
    $("#np_star_servant_class_" + row).val("");
    $("#np_star_servant_rare_" + row).val("");
    $("#na_" + row).val("0");
    $("#na_buff_" + row).val("0");
    $("#sr_" + row).val("0");
    $("#sr_buff_" + row).val("0");
    $("#b_hit_" + row).val("1");
    $("#a_hit_" + row).val("1");
    $("#q_hit_" + row).val("1");
    $("#ex_hit_" + row).val("1");
    $("#np_hit_" + row).val("1");
    $("#na_enemy_" + row).val("剣");
    $("#sr_enemy_" + row).val("剣");

    $("#poison_" + row).val("0");
    $("#poison_buff_" + row).val("0");
    $("#burn_" + row).val("0");
    $("#burn_buff_" + row).val("0");
    $("#curse_" + row).val("0");
    $("#curse_buff_" + row).val("0");
    $("#other_slip_" + row).val("0");
    $("#poison").val("0");
    $("#poison_buff").val("0");
    $("#burn").val("0");
    $("#burn_buff").val("0");
    $("#curse").val("0");
    $("#curse_buff").val("0");
    $("#other_slip").val("0");

    // サーヴァント画像変更
    setServantImage(row, "");

}

/**
 * パラメーター初期化（テーブルのみ）
 * @param row 行番号
 */
function clearParamTable(row) {

    $("#atk_" + row).val("0");
    $("#np_dmg_" + row).val("500");
    $("#np_kind_" + row).val("B");
    $("#atk_buff_" + row).val("0");
    $("#def_debuff_" + row).val("0");
    $("#b_card_buff_" + row).val("0");
    $("#b_card_debuff_" + row).val("0");
    $("#b_card_power_buff_" + row).val("0");
    $("#b_card_cri_buff_" + row).val("0");
    $("#a_card_buff_" + row).val("0");
    $("#a_card_debuff_" + row).val("0");
    $("#a_card_power_buff_" + row).val("0");
    $("#a_card_cri_buff_" + row).val("0");
    $("#q_card_buff_" + row).val("0");
    $("#q_card_debuff_" + row).val("0");
    $("#q_card_power_buff_" + row).val("0");
    $("#q_card_cri_buff_" + row).val("0");
    $("#cri_buff_" + row).val("0");
    $("#np_buff_" + row).val("0");
    $("#ex_atk_buff_" + row).val("0");
    $("#supereffective_buff_" + row).val("0");
    $("#supereffective_np_" + row).val("100");
    $("#fixed_dmg_" + row).val("0");
    $("#b_footprints_" + row).val("0");
    $("#a_footprints_" + row).val("0");
    $("#q_footprints_" + row).val("0");
    $("#special_def_" + row).val("0");
    $("#advanced_atk_buff_1st_" + row).val("0");
    $("#advanced_atk_buff_2nd_" + row).val("0");
    $("#advanced_atk_buff_3rd_" + row).val("0");
    $("#advanced_atk_buff_Ex_" + row).val("0");
    $("#advanced_def_debuff_1st_" + row).val("0");
    $("#advanced_def_debuff_2nd_" + row).val("0");
    $("#advanced_def_debuff_3rd_" + row).val("0");
    $("#advanced_def_debuff_Ex_" + row).val("0");
    $("#advanced_card_buff_1st_" + row).val("0");
    $("#advanced_card_buff_2nd_" + row).val("0");
    $("#advanced_card_buff_3rd_" + row).val("0");
    $("#advanced_card_debuff_1st_" + row).val("0");
    $("#advanced_card_debuff_2nd_" + row).val("0");
    $("#advanced_card_debuff_3rd_" + row).val("0");
    $("#advanced_cri_buff_1st_" + row).val("0");
    $("#advanced_cri_buff_2nd_" + row).val("0");
    $("#advanced_cri_buff_3rd_" + row).val("0");
    $("#advanced_supereffective_buff_1st_" + row).val("0");
    $("#advanced_supereffective_buff_2nd_" + row).val("0");
    $("#advanced_supereffective_buff_3rd_" + row).val("0");
    $("#advanced_supereffective_buff_Ex_" + row).val("0");
    $("#advanced_fixed_dmg_1st_" + row).val("0");
    $("#advanced_fixed_dmg_2nd_" + row).val("0");
    $("#advanced_fixed_dmg_3rd_" + row).val("0");
    $("#advanced_fixed_dmg_Ex_" + row).val("0");
    $("#advanced_special_def_1st_" + row).val("0");
    $("#advanced_special_def_2nd_" + row).val("0");
    $("#advanced_special_def_3rd_" + row).val("0");
    $("#advanced_special_def_Ex_" + row).val("0");
    $("#class_affinity_" + row).val("2.0");
    $("#attribute_affinity_" + row).val("1.0");
    $("#class_servant_" + row).val("1.00");
    $("#card_1st_" + row).val("NP");
    $("#card_1st_cri_" + row).val("Y");
    $("#card_2nd_" + row).val("B");
    $("#card_2nd_cri_" + row).val("Y");
    $("#card_3rd_" + row).val("B");
    $("#card_3rd_cri_" + row).val("Y");
    $("#ex_cri_" + row).val("Y");
    $("#dmg_min_1st_" + row).val("0");
    $("#dmg_ave_1st_" + row).val("0");
    $("#dmg_max_1st_" + row).val("0");
    $("#dmg_min_2nd_" + row).val("0");
    $("#dmg_ave_2nd_" + row).val("0");
    $("#dmg_max_2nd_" + row).val("0");
    $("#dmg_min_3rd_" + row).val("0");
    $("#dmg_ave_3rd_" + row).val("0");
    $("#dmg_max_3rd_" + row).val("0");
    $("#dmg_min_ex_" + row).val("0");
    $("#dmg_ave_ex_" + row).val("0");
    $("#dmg_max_ex_" + row).val("0");
    $("#dmg_min_total_" + row).val("0");
    $("#dmg_ave_total_" + row).val("0");
    $("#dmg_max_total_" + row).val("0");

    $("#na_" + row).val("0");
    $("#na_buff_" + row).val("0");
    $("#sr_" + row).val("0");
    $("#sr_buff_" + row).val("0");
    $("#b_hit_" + row).val("1");
    $("#a_hit_" + row).val("1");
    $("#q_hit_" + row).val("1");
    $("#ex_hit_" + row).val("1");
    $("#np_hit_" + row).val("1");
    $("#na_enemy_" + row).val("剣");
    $("#sr_enemy_" + row).val("剣");

    // サーヴァント画像変更
    setServantImage(row, "");

}

/**
 * 選択トータル初期化
 */
 function clearSelTotal() {

    selDamageTotal = 0;
    selDamageNum = 0;
    $(".sel_total").css({"display":""})
    $("#out_sel_total").val("0");
    $(".wrap_dmg_result").css({"background":""});
 }

/**
 * 行コピー
 * @param recNumber コピー元行
 * @param recNext コピー先行
 */
function copyParam(recNumber, recNext){
    $("#memo_" + recNext).val($("#memo_" + recNumber).val());
    $("#atk_" + recNext).val($("#atk_" + recNumber).val());
    $("#np_dmg_" + recNext).val($("#np_dmg_" + recNumber).val());
    $("#np_kind_" + recNext).val($("#np_kind_" + recNumber).val());
    $("#atk_buff_" + recNext).val($("#atk_buff_" + recNumber).val());
    $("#def_debuff_" + recNext).val($("#def_debuff_" + recNumber).val());
    $("#b_card_buff_" + recNext).val($("#b_card_buff_" + recNumber).val());
    $("#b_card_debuff_" + recNext).val($("#b_card_debuff_" + recNumber).val());
    $("#b_card_power_buff_" + recNext).val($("#b_card_power_buff_" + recNumber).val());
    $("#b_card_cri_buff_" + recNext).val($("#b_card_cri_buff_" + recNumber).val());
    $("#a_card_buff_" + recNext).val($("#a_card_buff_" + recNumber).val());
    $("#a_card_debuff_" + recNext).val($("#a_card_debuff_" + recNumber).val());
    $("#a_card_power_buff_" + recNext).val($("#a_card_power_buff_" + recNumber).val());
    $("#a_card_cri_buff_" + recNext).val($("#a_card_cri_buff_" + recNumber).val());
    $("#q_card_buff_" + recNext).val($("#q_card_buff_" + recNumber).val());
    $("#q_card_debuff_" + recNext).val($("#q_card_debuff_" + recNumber).val());
    $("#q_card_power_buff_" + recNext).val($("#q_card_power_buff_" + recNumber).val());
    $("#q_card_cri_buff_" + recNext).val($("#q_card_cri_buff_" + recNumber).val());
    $("#cri_buff_" + recNext).val($("#cri_buff_" + recNumber).val());
    $("#np_buff_" + recNext).val($("#np_buff_" + recNumber).val());
    $("#ex_atk_buff_" + recNext).val($("#ex_atk_buff_" + recNumber).val());
    $("#supereffective_buff_" + recNext).val($("#supereffective_buff_" + recNumber).val());
    $("#supereffective_np_" + recNext).val($("#supereffective_np_" + recNumber).val());
    $("#fixed_dmg_" + recNext).val($("#fixed_dmg_" + recNumber).val());
    $("#b_footprints_" + recNext).val($("#b_footprints_" + recNumber).val());
    $("#a_footprints_" + recNext).val($("#a_footprints_" + recNumber).val());
    $("#q_footprints_" + recNext).val($("#q_footprints_" + recNumber).val());
    $("#special_def_" + recNext).val($("#special_def_" + recNumber).val());
    $("#advanced_atk_buff_1st_" + recNext).val($("#advanced_atk_buff_1st_" + recNumber).val());
    $("#advanced_atk_buff_2nd_" + recNext).val($("#advanced_atk_buff_2nd_" + recNumber).val());
    $("#advanced_atk_buff_3rd_" + recNext).val($("#advanced_atk_buff_3rd_" + recNumber).val());
    $("#advanced_atk_buff_Ex_" + recNext).val($("#advanced_atk_buff_Ex_" + recNumber).val());
    $("#advanced_def_debuff_1st_" + recNext).val($("#advanced_def_debuff_1st_" + recNumber).val());
    $("#advanced_def_debuff_2nd_" + recNext).val($("#advanced_def_debuff_2nd_" + recNumber).val());
    $("#advanced_def_debuff_3rd_" + recNext).val($("#advanced_def_debuff_3rd_" + recNumber).val());
    $("#advanced_def_debuff_Ex_" + recNext).val($("#advanced_def_debuff_Ex_" + recNumber).val());
    $("#advanced_card_buff_1st_" + recNext).val($("#advanced_card_buff_1st_" + recNumber).val());
    $("#advanced_card_buff_2nd_" + recNext).val($("#advanced_card_buff_2nd_" + recNumber).val());
    $("#advanced_card_buff_3rd_" + recNext).val($("#advanced_card_buff_3rd_" + recNumber).val());
    $("#advanced_card_debuff_1st_" + recNext).val($("#advanced_card_debuff_1st_" + recNumber).val());
    $("#advanced_card_debuff_2nd_" + recNext).val($("#advanced_card_debuff_2nd_" + recNumber).val());
    $("#advanced_card_debuff_3rd_" + recNext).val($("#advanced_card_debuff_3rd_" + recNumber).val());
    $("#advanced_cri_buff_1st_" + recNext).val($("#advanced_cri_buff_1st_" + recNumber).val());
    $("#advanced_cri_buff_2nd_" + recNext).val($("#advanced_cri_buff_2nd_" + recNumber).val());
    $("#advanced_cri_buff_3rd_" + recNext).val($("#advanced_cri_buff_3rd_" + recNumber).val());
    $("#advanced_supereffective_buff_1st_" + recNext).val($("#advanced_supereffective_buff_1st_" + recNumber).val());
    $("#advanced_supereffective_buff_2nd_" + recNext).val($("#advanced_supereffective_buff_2nd_" + recNumber).val());
    $("#advanced_supereffective_buff_3rd_" + recNext).val($("#advanced_supereffective_buff_3rd_" + recNumber).val());
    $("#advanced_supereffective_buff_Ex_" + recNext).val($("#advanced_supereffective_buff_Ex_" + recNumber).val());
    $("#advanced_fixed_dmg_1st_" + recNext).val($("#advanced_fixed_dmg_1st_" + recNumber).val());
    $("#advanced_fixed_dmg_2nd_" + recNext).val($("#advanced_fixed_dmg_2nd_" + recNumber).val());
    $("#advanced_fixed_dmg_3rd_" + recNext).val($("#advanced_fixed_dmg_3rd_" + recNumber).val());
    $("#advanced_fixed_dmg_Ex_" + recNext).val($("#advanced_fixed_dmg_Ex_" + recNumber).val());
    $("#advanced_special_def_1st_" + recNext).val($("#advanced_special_def_1st_" + recNumber).val());
    $("#advanced_special_def_2nd_" + recNext).val($("#advanced_special_def_2nd_" + recNumber).val());
    $("#advanced_special_def_3rd_" + recNext).val($("#advanced_special_def_3rd_" + recNumber).val());
    $("#advanced_special_def_Ex_" + recNext).val($("#advanced_special_def_Ex_" + recNumber).val());
    $("#class_affinity_" + recNext).val($("#class_affinity_" + recNumber).val());
    $("#attribute_affinity_" + recNext).val($("#attribute_affinity_" + recNumber).val());
    $("#class_servant_" + recNext).val($("#class_servant_" + recNumber).val());
    $("#card_1st_" + recNext).val($("#card_1st_" + recNumber).val());
    $("#card_1st_cri_" + recNext).val($("#card_1st_cri_" + recNumber).val());
    $("#card_2nd_" + recNext).val($("#card_2nd_" + recNumber).val());
    $("#card_2nd_cri_" + recNext).val($("#card_2nd_cri_" + recNumber).val());
    $("#card_3rd_" + recNext).val($("#card_3rd_" + recNumber).val());
    $("#card_3rd_cri_" + recNext).val($("#card_3rd_cri_" + recNumber).val());
    $("#ex_cri_" + recNext).val($("#ex_cri_" + recNumber).val());

    $("#search_servant_no_" + recNext).val( $("#search_servant_no_" + recNumber).val());
    $("#search_servant_class_" + recNext).val($("#search_servant_class_" + recNumber).val());
    $("#search_servant_rare_" + recNext).val($("#search_servant_rare_" + recNumber).val());
    $("#search_servant_lvl_" + recNext).val($("#search_servant_lvl_" + recNumber).val());
    $("#search_servant_nplvl_" + recNext).val($("#search_servant_nplvl_" + recNumber).val());
    $("#search_servant_fou_" + recNext).val($("#search_servant_fou_" + recNumber).val());
    $("#search_servant_ce_" + recNext).val($("#search_servant_ce_" + recNumber).val());

    $("#prob_hp_" + recNext).val($("#prob_hp_" + recNumber).val());

    $("#np_star_servant_no_" + recNext).val($("#np_star_servant_no_" + recNumber).val());
    $("#np_star_servant_class_" + recNext).val($("#np_star_servant_class_" + recNumber).val());
    $("#np_star_servant_rare_" + recNext).val($("#np_star_servant_rare_" + recNumber).val());
    $("#na_" + recNext).val($("#na_" + recNumber).val());
    $("#na_buff_" + recNext).val($("#na_buff_" + recNumber).val());
    $("#sr_" + recNext).val($("#sr_" + recNumber).val());
    $("#sr_buff_" + recNext).val($("#sr_buff_" + recNumber).val());
    $("#b_hit_" + recNext).val($("#b_hit_" + recNumber).val());
    $("#a_hit_" + recNext).val($("#a_hit_" + recNumber).val());
    $("#q_hit_" + recNext).val($("#q_hit_" + recNumber).val());
    $("#ex_hit_" + recNext).val($("#ex_hit_" + recNumber).val());
    $("#np_hit_" + recNext).val($("#np_hit_" + recNumber).val());
    $("#na_enemy_" + recNext).val($("#na_enemy_" + recNumber).val());
    $("#sr_enemy_" + recNext).val($("#sr_enemy_" + recNumber).val());
    
    $("#poison_" + recNext).val($("#poison_" + recNumber).val());
    $("#poison_buff_" + recNext).val($("#poison_buff_" + recNumber).val());
    $("#burn_" + recNext).val($("#burn_" + recNumber).val());
    $("#burn_buff_" + recNext).val($("#burn_buff_" + recNumber).val());
    $("#curse_" + recNext).val($("#curse_" + recNumber).val());
    $("#curse_buff_" + recNext).val($("#curse_buff_" + recNumber).val());
    $("#other_slip_" + recNext).val($("#other_slip_" + recNumber).val());

    // サーヴァント画像変更
    setServantImage(recNext, $("#search_servant_no_" + recNumber).val());
}

/**
 * 行入れ替え
 * @param recNumber 入れ替え元行
 * @param recNext 入れ替え先行
 */
function changeParam(recNumber, recNext){
    var atk,np_dmg,np_kind,atk_buff,def_debuff, b_card_buff,b_card_cri_buff,a_card_buff,a_card_cri_buff,q_card_buff,q_card_cri_buff,cri_buff,
    b_card_debuff, b_card_power_buff, a_card_debuff, a_card_power_buff, q_card_debuff, q_card_power_buff,
    np_buff,ex_atk_buff,supereffective_buff,supereffective_np,fixed_dmg,b_footprints,a_footprints,q_footprints,special_def,
    advanced_atk_buff_1st,advanced_atk_buff_2nd,advanced_atk_buff_3rd,advanced_atk_buff_Ex,
    advanced_def_debuff_1st,advanced_def_debuff_2nd,advanced_def_debuff_3rd,advanced_def_debuff_Ex,
    advanced_card_buff_1st,advanced_card_buff_2nd,advanced_card_buff_3rd,
    advanced_card_debuff_1st,advanced_card_debuff_2nd,advanced_card_debuff_3rd,
    advanced_cri_buff_1st,advanced_cri_buff_2nd,advanced_cri_buff_3rd,advanced_supereffective_buff_1st,
    advanced_supereffective_buff_2nd,advanced_supereffective_buff_3rd,advanced_supereffective_buff_Ex,advanced_fixed_dmg_1st,advanced_fixed_dmg_2nd,
    advanced_fixed_dmg_3rd,advanced_fixed_dmg_Ex,advanced_special_def_1st,advanced_special_def_2nd,advanced_special_def_3rd,
    advanced_special_def_Ex,class_affinity,attribute_affinity,class_servant,card_1st,card_1st_cri,card_2nd,card_2nd_cri,card_3rd,
    card_3rd_cri,ex_cri,search_servant_no,search_servant_class,search_servant_rare,search_servant_lvl,search_servant_nplvl,
    search_servant_fou,search_servant_ce,prob_hp,np_star_servant_no, np_star_servant_class, np_star_servant_rare, na, na_buff, sr, sr_buff, b_hit, a_hit, q_hit, ex_hit, np_hit, na_enemy, sr_enemy,
    poison,poison_buff,burn,burn_buff,curse,curse_buff,other_slip,memo;

    memo = $("#memo_" + recNext).val();
    atk = $("#atk_" + recNext).val();
    np_dmg = $("#np_dmg_" + recNext).val();
    np_kind = $("#np_kind_" + recNext).val();
    atk_buff = $("#atk_buff_" + recNext).val();
    def_debuff = $("#def_debuff_" + recNext).val();
    b_card_buff = $("#b_card_buff_" + recNext).val();
    b_card_debuff = $("#b_card_debuff_" + recNext).val();
    b_card_power_buff = $("#b_card_power_buff_" + recNext).val();
    b_card_cri_buff = $("#b_card_cri_buff_" + recNext).val();
    a_card_buff = $("#a_card_buff_" + recNext).val();
    a_card_debuff = $("#a_card_debuff_" + recNext).val();
    a_card_power_buff = $("#a_card_power_buff_" + recNext).val();
    a_card_cri_buff = $("#a_card_cri_buff_" + recNext).val();
    q_card_buff = $("#q_card_buff_" + recNext).val();
    q_card_debuff = $("#q_card_debuff_" + recNext).val();
    q_card_power_buff = $("#q_card_power_buff_" + recNext).val();
    q_card_cri_buff = $("#q_card_cri_buff_" + recNext).val();
    cri_buff = $("#cri_buff_" + recNext).val();
    np_buff = $("#np_buff_" + recNext).val();
    ex_atk_buff = $("#ex_atk_buff_" + recNext).val();
    supereffective_buff = $("#supereffective_buff_" + recNext).val();
    supereffective_np = $("#supereffective_np_" + recNext).val();
    fixed_dmg = $("#fixed_dmg_" + recNext).val();
    b_footprints = $("#b_footprints_" + recNext).val();
    a_footprints = $("#a_footprints_" + recNext).val();
    q_footprints = $("#q_footprints_" + recNext).val();
    special_def = $("#special_def_" + recNext).val();
    advanced_atk_buff_1st = $("#advanced_atk_buff_1st_" + recNext).val();
    advanced_atk_buff_2nd = $("#advanced_atk_buff_2nd_" + recNext).val();
    advanced_atk_buff_3rd = $("#advanced_atk_buff_3rd_" + recNext).val();
    advanced_atk_buff_Ex = $("#advanced_atk_buff_Ex_" + recNext).val();
    advanced_def_debuff_1st = $("#advanced_def_debuff_1st_" + recNext).val();
    advanced_def_debuff_2nd = $("#advanced_def_debuff_2nd_" + recNext).val();
    advanced_def_debuff_3rd = $("#advanced_def_debuff_3rd_" + recNext).val();
    advanced_def_debuff_Ex = $("#advanced_def_debuff_Ex_" + recNext).val();
    advanced_card_buff_1st = $("#advanced_card_buff_1st_" + recNext).val();
    advanced_card_buff_2nd = $("#advanced_card_buff_2nd_" + recNext).val();
    advanced_card_buff_3rd = $("#advanced_card_buff_3rd_" + recNext).val();
    advanced_card_debuff_1st = $("#advanced_card_debuff_1st_" + recNext).val();
    advanced_card_debuff_2nd = $("#advanced_card_debuff_2nd_" + recNext).val();
    advanced_card_debuff_3rd = $("#advanced_card_debuff_3rd_" + recNext).val();
    advanced_cri_buff_1st = $("#advanced_cri_buff_1st_" + recNext).val();
    advanced_cri_buff_2nd = $("#advanced_cri_buff_2nd_" + recNext).val();
    advanced_cri_buff_3rd = $("#advanced_cri_buff_3rd_" + recNext).val();
    advanced_supereffective_buff_1st = $("#advanced_supereffective_buff_1st_" + recNext).val();
    advanced_supereffective_buff_2nd = $("#advanced_supereffective_buff_2nd_" + recNext).val();
    advanced_supereffective_buff_3rd = $("#advanced_supereffective_buff_3rd_" + recNext).val();
    advanced_supereffective_buff_Ex = $("#advanced_supereffective_buff_Ex_" + recNext).val();
    advanced_fixed_dmg_1st = $("#advanced_fixed_dmg_1st_" + recNext).val();
    advanced_fixed_dmg_2nd = $("#advanced_fixed_dmg_2nd_" + recNext).val();
    advanced_fixed_dmg_3rd = $("#advanced_fixed_dmg_3rd_" + recNext).val();
    advanced_fixed_dmg_Ex = $("#advanced_fixed_dmg_Ex_" + recNext).val();
    advanced_special_def_1st = $("#advanced_special_def_1st_" + recNext).val();
    advanced_special_def_2nd = $("#advanced_special_def_2nd_" + recNext).val();
    advanced_special_def_3rd = $("#advanced_special_def_3rd_" + recNext).val();
    advanced_special_def_Ex = $("#advanced_special_def_Ex_" + recNext).val();
    class_affinity = $("#class_affinity_" + recNext).val();
    attribute_affinity = $("#attribute_affinity_" + recNext).val();
    class_servant = $("#class_servant_" + recNext).val();
    card_1st = $("#card_1st_" + recNext).val();
    card_1st_cri = $("#card_1st_cri_" + recNext).val();
    card_2nd = $("#card_2nd_" + recNext).val();
    card_2nd_cri = $("#card_2nd_cri_" + recNext).val();
    card_3rd = $("#card_3rd_" + recNext).val();
    card_3rd_cri = $("#card_3rd_cri_" + recNext).val();
    ex_cri = $("#ex_cri_" + recNext).val();

    search_servant_no = $("#search_servant_no_" + recNext).val();
    search_servant_class = $("#search_servant_class_" + recNext).val();
    search_servant_rare = $("#search_servant_rare_" + recNext).val();
    search_servant_lvl = $("#search_servant_lvl_" + recNext).val();
    search_servant_nplvl = $("#search_servant_nplvl_" + recNext).val();
    search_servant_fou = $("#search_servant_fou_" + recNext).val();
    search_servant_ce = $("#search_servant_ce_" + recNext).val();

    prob_hp = $("#prob_hp_" + recNext).val();

    np_star_servant_no = $("#np_star_servant_no_" + recNext).val();
    np_star_servant_class = $("#np_star_servant_class_" + recNext).val();
    np_star_servant_rare = $("#np_star_servant_rare_" + recNext).val();
    na = $("#na_" + recNext).val();
    na_buff = $("#na_buff_" + recNext).val();
    sr = $("#sr_" + recNext).val();
    sr_buff = $("#sr_buff_" + recNext).val();
    b_hit = $("#b_hit_" + recNext).val();
    a_hit = $("#a_hit_" + recNext).val();
    q_hit = $("#q_hit_" + recNext).val();
    ex_hit = $("#ex_hit_" + recNext).val();
    np_hit = $("#np_hit_" + recNext).val();
    na_enemy = $("#na_enemy_" + recNext).val();
    sr_enemy = $("#sr_enemy_" + recNext).val();

    poison = $("#poison_" + recNext).val();
    poison_buff = $("#poison_buff_" + recNext).val();
    burn = $("#burn_" + recNext).val();
    burn_buff = $("#burn_buff_" + recNext).val();
    curse = $("#curse_" + recNext).val();
    curse_buff = $("#curse_buff_" + recNext).val();
    other_slip = $("#other_slip_" + recNext).val();

    // コピー
    copyParam(recNumber, recNext);
    
    $("#memo_" + recNumber).val(memo);
    $("#atk_" + recNumber).val(atk);
    $("#np_dmg_" + recNumber).val(np_dmg);
    $("#np_kind_" + recNumber).val(np_kind);
    $("#atk_buff_" + recNumber).val(atk_buff);
    $("#def_debuff_" + recNumber).val(def_debuff);
    $("#b_card_buff_" + recNumber).val(b_card_buff);
    $("#b_card_debuff_" + recNumber).val(b_card_debuff);
    $("#b_card_power_buff_" + recNumber).val(b_card_power_buff);
    $("#b_card_cri_buff_" + recNumber).val(b_card_cri_buff);
    $("#a_card_buff_" + recNumber).val(a_card_buff);
    $("#a_card_debuff_" + recNumber).val(a_card_debuff);
    $("#a_card_power_buff_" + recNumber).val(a_card_power_buff);
    $("#a_card_cri_buff_" + recNumber).val(a_card_cri_buff);
    $("#q_card_buff_" + recNumber).val(q_card_buff);
    $("#q_card_debuff_" + recNumber).val(q_card_debuff);
    $("#q_card_power_buff_" + recNumber).val(q_card_power_buff);
    $("#q_card_cri_buff_" + recNumber).val(q_card_cri_buff);
    $("#cri_buff_" + recNumber).val(cri_buff);
    $("#np_buff_" + recNumber).val(np_buff);
    $("#ex_atk_buff_" + recNumber).val(ex_atk_buff);
    $("#supereffective_buff_" + recNumber).val(supereffective_buff);
    $("#supereffective_np_" + recNumber).val(supereffective_np);
    $("#fixed_dmg_" + recNumber).val(fixed_dmg);
    $("#b_footprints_" + recNumber).val(b_footprints);
    $("#a_footprints_" + recNumber).val(a_footprints);
    $("#q_footprints_" + recNumber).val(q_footprints);
    $("#special_def_" + recNumber).val(special_def);
    $("#advanced_atk_buff_1st_" + recNumber).val(advanced_atk_buff_1st);
    $("#advanced_atk_buff_2nd_" + recNumber).val(advanced_atk_buff_2nd);
    $("#advanced_atk_buff_3rd_" + recNumber).val(advanced_atk_buff_3rd);
    $("#advanced_atk_buff_Ex_" + recNumber).val(advanced_atk_buff_Ex);
    $("#advanced_def_debuff_1st_" + recNumber).val(advanced_def_debuff_1st);
    $("#advanced_def_debuff_2nd_" + recNumber).val(advanced_def_debuff_2nd);
    $("#advanced_def_debuff_3rd_" + recNumber).val(advanced_def_debuff_3rd);
    $("#advanced_def_debuff_Ex_" + recNumber).val(advanced_def_debuff_Ex);
    $("#advanced_card_buff_1st_" + recNumber).val(advanced_card_buff_1st);
    $("#advanced_card_buff_2nd_" + recNumber).val(advanced_card_buff_2nd);
    $("#advanced_card_buff_3rd_" + recNumber).val(advanced_card_buff_3rd);
    $("#advanced_card_debuff_1st_" + recNumber).val(advanced_card_debuff_1st);
    $("#advanced_card_debuff_2nd_" + recNumber).val(advanced_card_debuff_2nd);
    $("#advanced_card_debuff_3rd_" + recNumber).val(advanced_card_debuff_3rd);
    $("#advanced_cri_buff_1st_" + recNumber).val(advanced_cri_buff_1st);
    $("#advanced_cri_buff_2nd_" + recNumber).val(advanced_cri_buff_2nd);
    $("#advanced_cri_buff_3rd_" + recNumber).val(advanced_cri_buff_3rd);
    $("#advanced_supereffective_buff_1st_" + recNumber).val(advanced_supereffective_buff_1st);
    $("#advanced_supereffective_buff_2nd_" + recNumber).val(advanced_supereffective_buff_2nd);
    $("#advanced_supereffective_buff_3rd_" + recNumber).val(advanced_supereffective_buff_3rd);
    $("#advanced_supereffective_buff_Ex_" + recNumber).val(advanced_supereffective_buff_Ex);
    $("#advanced_fixed_dmg_1st_" + recNumber).val(advanced_fixed_dmg_1st);
    $("#advanced_fixed_dmg_2nd_" + recNumber).val(advanced_fixed_dmg_2nd);
    $("#advanced_fixed_dmg_3rd_" + recNumber).val(advanced_fixed_dmg_3rd);
    $("#advanced_fixed_dmg_Ex_" + recNumber).val(advanced_fixed_dmg_Ex);
    $("#advanced_special_def_1st_" + recNumber).val(advanced_special_def_1st);
    $("#advanced_special_def_2nd_" + recNumber).val(advanced_special_def_2nd);
    $("#advanced_special_def_3rd_" + recNumber).val(advanced_special_def_3rd);
    $("#advanced_special_def_Ex_" + recNumber).val(advanced_special_def_Ex);
    $("#class_affinity_" + recNumber).val(class_affinity);
    $("#attribute_affinity_" + recNumber).val(attribute_affinity);
    $("#class_servant_" + recNumber).val(class_servant);
    $("#card_1st_" + recNumber).val(card_1st);
    $("#card_1st_cri_" + recNumber).val(card_1st_cri);
    $("#card_2nd_" + recNumber).val(card_2nd);
    $("#card_2nd_cri_" + recNumber).val(card_2nd_cri);
    $("#card_3rd_" + recNumber).val(card_3rd);
    $("#card_3rd_cri_" + recNumber).val(card_3rd_cri);
    $("#ex_cri_" + recNumber).val(ex_cri);
    
    $("#search_servant_no_" + recNumber).val(search_servant_no);
    $("#search_servant_class_" + recNumber).val(search_servant_class);
    $("#search_servant_rare_" + recNumber).val(search_servant_rare);
    $("#search_servant_lvl_" + recNumber).val(search_servant_lvl);
    $("#search_servant_nplvl_" + recNumber).val(search_servant_nplvl);
    $("#search_servant_fou_" + recNumber).val(search_servant_fou);
    $("#search_servant_ce_" + recNumber).val(search_servant_ce);
    
    $("#prob_hp_" + recNumber).val(prob_hp);

    $("#np_star_servant_no_" + recNumber).val(np_star_servant_no);
    $("#np_star_servant_class_" + recNumber).val(np_star_servant_class);
    $("#np_star_servant_rare_" + recNumber).val(np_star_servant_rare);
    $("#na_" + recNumber).val(na);
    $("#na_buff_" + recNumber).val(na_buff);
    $("#sr_" + recNumber).val(sr);
    $("#sr_buff_" + recNumber).val(sr_buff);
    $("#b_hit_" + recNumber).val(b_hit);
    $("#a_hit_" + recNumber).val(a_hit);
    $("#q_hit_" + recNumber).val(q_hit);
    $("#ex_hit_" + recNumber).val(ex_hit);
    $("#np_hit_" + recNumber).val(np_hit);
    $("#na_enemy_" + recNumber).val(na_enemy);
    $("#sr_enemy_" + recNumber).val(sr_enemy);
    
    $("#poison_" + recNumber).val(poison);
    $("#poison_buff_" + recNumber).val(poison_buff);
    $("#burn_" + recNumber).val(burn);
    $("#burn_buff_" + recNumber).val(burn_buff);
    $("#curse_" + recNumber).val(curse);
    $("#curse_buff_" + recNumber).val(curse_buff);
    $("#other_slip_" + recNumber).val(other_slip);

    // サーヴァント画像変更
    setServantImage(recNumber, search_servant_no);
    
}

/**
 * 入力値をカンマ区切りで取得
 * @param recNumber 行番号
 */
function getRecData(recNumber){

    return $("#atk_" + recNumber).val()
            + "," + $("#np_dmg_" + recNumber).val()
            + "," + $("#np_kind_" + recNumber).val()
            + "," + $("#atk_buff_" + recNumber).val()
            + "," + $("#def_debuff_" + recNumber).val()
            + "," + $("#b_card_buff_" + recNumber).val()
            + "," + $("#b_card_debuff_" + recNumber).val()
            + "," + $("#b_card_power_buff_" + recNumber).val()
            + "," + $("#b_card_cri_buff_" + recNumber).val()
            + "," + $("#a_card_buff_" + recNumber).val()
            + "," + $("#a_card_debuff_" + recNumber).val()
            + "," + $("#a_card_power_buff_" + recNumber).val()
            + "," + $("#a_card_cri_buff_" + recNumber).val()
            + "," + $("#q_card_buff_" + recNumber).val()
            + "," + $("#q_card_debuff_" + recNumber).val()
            + "," + $("#q_card_power_buff_" + recNumber).val()
            + "," + $("#q_card_cri_buff_" + recNumber).val()
            + "," + $("#cri_buff_" + recNumber).val()
            + "," + $("#np_buff_" + recNumber).val()
            + "," + $("#ex_atk_buff_" + recNumber).val()
            + "," + $("#supereffective_buff_" + recNumber).val()
            + "," + $("#supereffective_np_" + recNumber).val()
            + "," + $("#fixed_dmg_" + recNumber).val()
            + "," + $("#b_footprints_" + recNumber).val()
            + "," + $("#a_footprints_" + recNumber).val()
            + "," + $("#q_footprints_" + recNumber).val()
            + "," + $("#special_def_" + recNumber).val()
            + "," + $("#advanced_atk_buff_1st_" + recNumber).val()
            + "," + $("#advanced_atk_buff_2nd_" + recNumber).val()
            + "," + $("#advanced_atk_buff_3rd_" + recNumber).val()
            + "," + $("#advanced_atk_buff_Ex_" + recNumber).val()
            + "," + $("#advanced_def_debuff_1st_" + recNumber).val()
            + "," + $("#advanced_def_debuff_2nd_" + recNumber).val()
            + "," + $("#advanced_def_debuff_3rd_" + recNumber).val()
            + "," + $("#advanced_def_debuff_Ex_" + recNumber).val()
            + "," + $("#advanced_card_buff_1st_" + recNumber).val()
            + "," + $("#advanced_card_buff_2nd_" + recNumber).val()
            + "," + $("#advanced_card_buff_3rd_" + recNumber).val()
            + "," + $("#advanced_card_debuff_1st_" + recNumber).val()
            + "," + $("#advanced_card_debuff_2nd_" + recNumber).val()
            + "," + $("#advanced_card_debuff_3rd_" + recNumber).val()
            + "," + $("#advanced_cri_buff_1st_" + recNumber).val()
            + "," + $("#advanced_cri_buff_2nd_" + recNumber).val()
            + "," + $("#advanced_cri_buff_3rd_" + recNumber).val()
            + "," + $("#advanced_supereffective_buff_1st_" + recNumber).val()
            + "," + $("#advanced_supereffective_buff_2nd_" + recNumber).val()
            + "," + $("#advanced_supereffective_buff_3rd_" + recNumber).val()
            + "," + $("#advanced_supereffective_buff_Ex_" + recNumber).val()
            + "," + $("#advanced_fixed_dmg_1st_" + recNumber).val()
            + "," + $("#advanced_fixed_dmg_2nd_" + recNumber).val()
            + "," + $("#advanced_fixed_dmg_3rd_" + recNumber).val()
            + "," + $("#advanced_fixed_dmg_Ex_" + recNumber).val()
            + "," + $("#advanced_special_def_1st_" + recNumber).val()
            + "," + $("#advanced_special_def_2nd_" + recNumber).val()
            + "," + $("#advanced_special_def_3rd_" + recNumber).val()
            + "," + $("#advanced_special_def_Ex_" + recNumber).val()
            + "," + $("#class_affinity_" + recNumber).val()
            + "," + $("#attribute_affinity_" + recNumber).val()
            + "," + $("#class_servant_" + recNumber).val()
            + "," + $("#card_1st_" + recNumber).val()
            + "," + $("#card_1st_cri_" + recNumber).val()
            + "," + $("#card_2nd_" + recNumber).val()
            + "," + $("#card_2nd_cri_" + recNumber).val()
            + "," + $("#card_3rd_" + recNumber).val()
            + "," + $("#card_3rd_cri_" + recNumber).val()
            + "," + $("#ex_cri_" + recNumber).val()
            + "," + $("#search_servant_no_" + recNumber).val()
            + "," + $("#search_servant_class_" + recNumber).val()
            + "," + $("#search_servant_rare_" + recNumber).val()
            + "," + $("#search_servant_lvl_" + recNumber).val()
            + "," + $("#search_servant_nplvl_" + recNumber).val()
            + "," + $("#search_servant_fou_" + recNumber).val()
            + "," + $("#search_servant_ce_" + recNumber).val()
            + "," + $("#prob_hp_" + recNumber).val()
            + "," + $("#poison_" + recNumber).val()
            + "," + $("#poison_buff_" + recNumber).val()
            + "," + $("#burn_" + recNumber).val()
            + "," + $("#burn_buff_" + recNumber).val()
            + "," + $("#curse_" + recNumber).val()
            + "," + $("#curse_buff_" + recNumber).val()
            + "," + $("#other_slip_" + recNumber).val()
            + "," + $("#memo_" + recNumber).val().replaceAll(",","\t")
            + "," + $("#np_star_servant_no_" + recNumber).val()
            + "," + $("#np_star_servant_class_" + recNumber).val()
            + "," + $("#np_star_servant_rare_" + recNumber).val()
            + "," + $("#na_" + recNumber).val()
            + "," + $("#na_buff_" + recNumber).val()
            + "," + $("#sr_" + recNumber).val()
            + "," + $("#sr_buff_" + recNumber).val()
            + "," + $("#b_hit_" + recNumber).val()
            + "," + $("#a_hit_" + recNumber).val()
            + "," + $("#q_hit_" + recNumber).val()
            + "," + $("#ex_hit_" + recNumber).val()
            + "," + $("#np_hit_" + recNumber).val()
            + "," + $("#na_enemy_" + recNumber).val()
            + "," + $("#sr_enemy_" + recNumber).val();

}

/**
 * 入力値を設定
 * @param recNumber 行番号
 * @param inputData 入力値
 */
function setRecData(recNumber, inputData){

    var splitData = inputData.split(",");

    try {
        $("#atk_" + recNumber).val(splitData[0]);
        $("#np_dmg_" + recNumber).val(splitData[1]);
        $("#np_kind_" + recNumber).val(splitData[2]);
        $("#atk_buff_" + recNumber).val(splitData[3]);
        $("#def_debuff_" + recNumber).val(splitData[4]);
        $("#b_card_buff_" + recNumber).val(splitData[5]);
        $("#b_card_debuff_" + recNumber).val(splitData[6]);
        $("#b_card_power_buff_" + recNumber).val(splitData[7]);
        $("#b_card_cri_buff_" + recNumber).val(splitData[8]);
        $("#a_card_buff_" + recNumber).val(splitData[9]);
        $("#a_card_debuff_" + recNumber).val(splitData[10]);
        $("#a_card_power_buff_" + recNumber).val(splitData[11]);
        $("#a_card_cri_buff_" + recNumber).val(splitData[12]);
        $("#q_card_buff_" + recNumber).val(splitData[13]);
        $("#q_card_debuff_" + recNumber).val(splitData[14]);
        $("#q_card_power_buff_" + recNumber).val(splitData[15]);
        $("#q_card_cri_buff_" + recNumber).val(splitData[16]);
        $("#cri_buff_" + recNumber).val(splitData[17]);
        $("#np_buff_" + recNumber).val(splitData[18]);
        $("#ex_atk_buff_" + recNumber).val(splitData[19]);
        $("#supereffective_buff_" + recNumber).val(splitData[20]);
        $("#supereffective_np_" + recNumber).val(splitData[21]);
        $("#fixed_dmg_" + recNumber).val(splitData[22]);
        $("#b_footprints_" + recNumber).val(splitData[23]);
        $("#a_footprints_" + recNumber).val(splitData[24]);
        $("#q_footprints_" + recNumber).val(splitData[25]);
        $("#special_def_" + recNumber).val(splitData[26]);
        $("#advanced_atk_buff_1st_" + recNumber).val(splitData[27]);
        $("#advanced_atk_buff_2nd_" + recNumber).val(splitData[28]);
        $("#advanced_atk_buff_3rd_" + recNumber).val(splitData[29]);
        $("#advanced_atk_buff_Ex_" + recNumber).val(splitData[30]);
        $("#advanced_def_debuff_1st_" + recNumber).val(splitData[31]);
        $("#advanced_def_debuff_2nd_" + recNumber).val(splitData[32]);
        $("#advanced_def_debuff_3rd_" + recNumber).val(splitData[33]);
        $("#advanced_def_debuff_Ex_" + recNumber).val(splitData[34]);
        $("#advanced_card_buff_1st_" + recNumber).val(splitData[35]);
        $("#advanced_card_buff_2nd_" + recNumber).val(splitData[36]);
        $("#advanced_card_buff_3rd_" + recNumber).val(splitData[37]);
        $("#advanced_card_debuff_1st_" + recNumber).val(splitData[38]);
        $("#advanced_card_debuff_2nd_" + recNumber).val(splitData[39]);
        $("#advanced_card_debuff_3rd_" + recNumber).val(splitData[40]);
        $("#advanced_cri_buff_1st_" + recNumber).val(splitData[41]);
        $("#advanced_cri_buff_2nd_" + recNumber).val(splitData[42]);
        $("#advanced_cri_buff_3rd_" + recNumber).val(splitData[43]);
        $("#advanced_supereffective_buff_1st_" + recNumber).val(splitData[44]);
        $("#advanced_supereffective_buff_2nd_" + recNumber).val(splitData[45]);
        $("#advanced_supereffective_buff_3rd_" + recNumber).val(splitData[46]);
        $("#advanced_supereffective_buff_Ex_" + recNumber).val(splitData[47]);
        $("#advanced_fixed_dmg_1st_" + recNumber).val(splitData[48]);
        $("#advanced_fixed_dmg_2nd_" + recNumber).val(splitData[49]);
        $("#advanced_fixed_dmg_3rd_" + recNumber).val(splitData[50]);
        $("#advanced_fixed_dmg_Ex_" + recNumber).val(splitData[51]);
        $("#advanced_special_def_1st_" + recNumber).val(splitData[52]);
        $("#advanced_special_def_2nd_" + recNumber).val(splitData[53]);
        $("#advanced_special_def_3rd_" + recNumber).val(splitData[54]);
        $("#advanced_special_def_Ex_" + recNumber).val(splitData[55]);
        $("#class_affinity_" + recNumber).val(splitData[56]);
        $("#attribute_affinity_" + recNumber).val(splitData[57]);
        $("#class_servant_" + recNumber).val(splitData[58]);
        $("#card_1st_" + recNumber).val(splitData[59]);
        $("#card_1st_cri_" + recNumber).val(splitData[60]);
        $("#card_2nd_" + recNumber).val(splitData[61]);
        $("#card_2nd_cri_" + recNumber).val(splitData[62]);
        $("#card_3rd_" + recNumber).val(splitData[63]);
        $("#card_3rd_cri_" + recNumber).val(splitData[64]);
        $("#ex_cri_" + recNumber).val(splitData[65]);
        $("#search_servant_no_" + recNumber).val(splitData[66]);
        $("#search_servant_class_" + recNumber).val(splitData[67]);
        $("#search_servant_rare_" + recNumber).val(splitData[68]);
        $("#search_servant_lvl_" + recNumber).val(splitData[69]);
        $("#search_servant_nplvl_" + recNumber).val(splitData[70]);
        $("#search_servant_fou_" + recNumber).val(splitData[71]);
        $("#search_servant_ce_" + recNumber).val(splitData[72]);
        $("#prob_hp_" + recNumber).val(splitData[73]);
        $("#poison_" + recNumber).val(splitData[74]);
        $("#poison_buff_" + recNumber).val(splitData[75]);
        $("#burn_" + recNumber).val(splitData[76]);
        $("#burn_buff_" + recNumber).val(splitData[77]);
        $("#curse_" + recNumber).val(splitData[78]);
        $("#curse_buff_" + recNumber).val(splitData[79]);
        $("#other_slip_" + recNumber).val(splitData[80]);
        $("#memo_" + recNumber).val(splitData[81].replaceAll("\t",","));
        $("#np_star_servant_no_" + recNumber).val(splitData[82]);
        $("#np_star_servant_class_" + recNumber).val(splitData[83]);
        $("#np_star_servant_rare_" + recNumber).val(splitData[84]);
        $("#na_" + recNumber).val(splitData[85]);
        $("#na_buff_" + recNumber).val(splitData[86]);
        $("#sr_" + recNumber).val(splitData[87]);
        $("#sr_buff_" + recNumber).val(splitData[88]);
        $("#b_hit_" + recNumber).val(splitData[89]);
        $("#a_hit_" + recNumber).val(splitData[90]);
        $("#q_hit_" + recNumber).val(splitData[91]);
        $("#ex_hit_" + recNumber).val(splitData[92]);
        $("#np_hit_" + recNumber).val(splitData[93]);
        $("#na_enemy_" + recNumber).val(splitData[94]);
        $("#sr_enemy_" + recNumber).val(splitData[95]);
        // サーヴァント画像変更
        setServantImage(recNumber, $("#search_servant_no_" + recNumber).val());
    } catch (error) {
    }

}

/**
 * サーヴァント画像変更
 * @param recNumber 行番号
 * @param servantNo サーヴァントNo
 */
function setServantImage(recNumber, servantNo){

    try {
        if (servantNo == ""){
            $("#servant_img_default_" + recNumber).removeClass("d-none");
            $("#sevant_face_img_" + recNumber)[0].src = "";
            $("#servant_img_select_" + recNumber).addClass("d-none");
        }
        else {
            $("#servant_img_select_" + recNumber).removeClass("d-none");
            $("#sevant_face_img_" + recNumber)[0].src = "img/servant_face/" + servantNo + ".png"
            $("#servant_img_default_" + recNumber).addClass("d-none");
        }
    }
    catch {
    }
    
}

/**
 * サーヴァント情報反映
 * @return result 計算可能or不可能
 */
function servantApply() {

    var result = false;
    var caseClass;

    if ($("#servant-name").val() != null) {

        $(servantList).each(function() {
            
            if ($("#servant-name").val() == this["No"]) {

                $("#NA").val(this["N_N/A"]);
                $("#NA_buff").val(this["クラススキル_NP獲得バフ"]);
                $("#SR").val(this["SR"]);
                $("#SR_buff").val(this["クラススキル_スター獲得バフ"]);
                $("#b_hit").val(this["BHIT"]);
                $("#a_hit").val(this["AHIT"]);
                $("#q_hit").val(this["QHIT"]);
                $("#ex_hit").val(this["EXHIT"]);
                $("#np_hit").val(this["宝具HIT"]);
                $("#np_kind_np_star").val(this["宝具カード"]);

                caseClass = this["クラス"];

                return ;

            }

        });
        
        switch (caseClass) {
            case "剣" :
                caseClass = "Saber"
                break;
            case "弓" :
                caseClass = "Archer"
                break;
            case "槍" :
                caseClass = "Lancer"
                break;
            case "騎" :
                caseClass = "Rider"
                break;
            case "術" :
                caseClass = "Caster"
                break;
            case "殺" :
                caseClass = "Assasin"
                break;
            case "狂" :
                caseClass = "Berserker"
                break;
            case "裁" :
            case "讐" :
            case "月" :
            case "盾" :
                caseClass = "EX1"
                break;
            case "分" :
            case "降" :
            case "詐" :
            case "獣" :
                caseClass = "EX2"
                break;
            default :
                break;
        }

        // クラススコア反映
        $(classScoreDataList).each(function() {

            if (this.class == caseClass) {
                $("#SR_buff").val(BigNumber(parseFloat($("#SR_buff").val())).plus(parseFloat(this.sr_buff)));

                return;
            }

        });

        result = true;

    }

    return result;

}

/**
 * サーヴァント情報表示
 */
function servantInfo() {
    var servantNo = $("#search_servant_name").val();

    if (servantNo == null){
        // HP ATK
        $("#servant_search_hp")[0].innerText = "";
        $("#servant_search_atk")[0].innerText = "";
        // 天地人
        $("#servant_search_attribute")[0].innerText = "";
        // 属性
        $("#servant_search_alignment")[0].innerText = "";
        // カード
        $("#servant_search_deck")[0].innerText = "";
        // ヒット数
        $("#servant_search_nit")[0].innerText = "";
        // NP獲得率 スター発生率
        $("#servant_search_npGein")[0].innerText = "";
        $("#servant_search_starGen")[0].innerText = "";
        // 宝具
        $("#servant_search_np")[0].innerText = "";
        // スキル
        $("#servant_search_skill1")[0].innerText = "";
        $("#servant_search_skill2")[0].innerText = "";
        $("#servant_search_skill3")[0].innerText = "";
        // クラススキル
        let classSkill = "";
        $("#servant_search_classSkill")[0].innerText = "";
        // アペンドスキル
        $("#servant_search_appendSkill")[0].innerText = "";
        // 絆
        $("#servant_search_bondCE")[0].innerText = "";
        // 特性
        $("#servant_search_trait")[0].innerText = "";
        return;
    }

    $(servantList).each(function() {

        if (this["No"] == servantNo) {

            var hp,atk;

            switch ($("#search_servant_lvl").val()) {
                case "MAX" :
                    hp = Number(this["MaxHP"]);
                    atk = Number(this["MaxAtk"]);
                    break;
                case "100" :
                    hp = rounddown(Number(this["BaseHP"]) 
                        + (Number(this["MaxHP"]) - Number(this["BaseHP"])) 
                        * Number(correctio_lv100[Number(this["レアリティ"])]),0);
                    atk = rounddown(Number(this["BaseAtk"]) 
                        + (Number(this["MaxAtk"]) - Number(this["BaseAtk"])) 
                        * Number(correctio_lv100[Number(this["レアリティ"])]),0);
                    break;
                case "110" :
                    hp = rounddown(Number(this["BaseHP"]) 
                        + (Number(this["MaxHP"]) - Number(this["BaseHP"])) 
                        * Number(correctio_lv110[Number(this["レアリティ"])]),0);
                    atk = rounddown(Number(this["BaseAtk"]) 
                        + (Number(this["MaxAtk"]) - Number(this["BaseAtk"])) 
                        * Number(correctio_lv110[Number(this["レアリティ"])]),0);
                    break;
                case "120" :
                    hp = rounddown(Number(this["BaseHP"]) 
                        + (Number(this["MaxHP"]) - Number(this["BaseHP"])) 
                        * Number(correctio_lv120[Number(this["レアリティ"])]),0);
                    atk = rounddown(Number(this["BaseAtk"]) 
                        + (Number(this["MaxAtk"]) - Number(this["BaseAtk"])) 
                        * Number(correctio_lv120[Number(this["レアリティ"])]),0);
                    break;
                default :
                    break;
            }

            // HP ATK
            $("#servant_search_hp")[0].innerText = Number(hp).toLocaleString();
            $("#servant_search_atk")[0].innerText = Number(atk).toLocaleString() + "(" + Number(Number(atk) + Number($("#search_servant_fou").val()) + Number($("#search_servant_ceatk").val())).toLocaleString() + ")";
            // 天地人
            $("#servant_search_attribute")[0].innerText = this["天地人"];
            // 属性
            $("#servant_search_alignment")[0].innerText = this["属性"] + "/" + this["性格"];
            // カード
            $("#servant_search_deck")[0].innerText = "Q：" + (this["カード"].match( new RegExp("Q", "g") ) || []).length + "枚/A：" + (this["カード"].match( new RegExp("A", "g") ) || []).length + "枚/B：" + (this["カード"].match( new RegExp("B", "g") ) || []).length + "枚";
            // ヒット数
            $("#servant_search_nit")[0].innerText = "Q：" + this["QHIT"] + "HIT/A：" + this["AHIT"] + "HIT/B：" + this["BHIT"] + "HIT/EX：" + this["EXHIT"] + "HIT/宝具：" + this["宝具HIT"] + "HIT";
            // NP獲得率 スター発生率
            $("#servant_search_npGein")[0].innerText = this["N_N/A"];
            $("#servant_search_starGen")[0].innerText = this["SR"];
            // 宝具
            let np_kind;
            let np_lvl;
            switch (this["宝具カード"]) {
                case "B" :
                    np_kind = "Buster"
                    break;
                case "A" :
                    np_kind = "Arts"
                    break;
                case "Q" :
                    np_kind = "Quick"
                    break;
                default :
                    break;
            }
            switch ($("#search_servant_nplvl").val()) {
                case "1" :
                    np_lvl = this["宝具Lv1"];
                    break;
                case "2" :
                    np_lvl = this["宝具Lv2"];
                    break;
                case "3" :
                    np_lvl = this["宝具Lv3"];
                    break;
                case "4" :
                    np_lvl = this["宝具Lv4"];
                    break;
                case "5" :
                    np_lvl = this["宝具Lv5"];
                    break;
                default :
                    break;
            }
            let np = "【" + this["宝具名"] + "】 種類：" + np_kind + "\n" + this["宝具効果"].replaceAll("$","LV" + $("#search_servant_nplvl").val() + ":" + np_lvl);
            $("#servant_search_np")[0].innerText = np;
            // スキル
            let skill1 = "【" + this["スキル1名"] + "】 CT：" + this["スキル1CT"] + "→" + Number(Number(this["スキル1CT"]) - 2) + "\n" + this["スキル1効果"];
            $("#servant_search_skill1")[0].innerText = skill1;
            let skill2 = "【" + this["スキル2名"] + "】 CT：" + this["スキル2CT"] + "→" + Number(Number(this["スキル2CT"]) - 2) + "\n" + this["スキル2効果"];
            $("#servant_search_skill2")[0].innerText = skill2;
            let skill3 = "【" + this["スキル3名"] + "】 CT：" + this["スキル3CT"] + "→" + Number(Number(this["スキル3CT"]) - 2) + "\n" + this["スキル3効果"];
            $("#servant_search_skill3")[0].innerText = skill3;
            // クラススキル
            let classSkill = "";
            if (this["クラススキル1名"] != "") {classSkill += "【" + this["クラススキル1名"] + "】" + "\n" + this["クラススキル1効果"];}
            if (this["クラススキル2名"] != "") {classSkill += "\n" + "【" + this["クラススキル2名"] + "】" + "\n" + this["クラススキル2効果"];}
            if (this["クラススキル3名"] != "") {classSkill += "\n" + "【" + this["クラススキル3名"] + "】" + "\n" + this["クラススキル3効果"];}
            if (this["クラススキル4名"] != "") {classSkill += "\n" + "【" + this["クラススキル4名"] + "】" + "\n" + this["クラススキル4効果"];}
            if (this["クラススキル5名"] != "") {classSkill += "\n" + "【" + this["クラススキル5名"] + "】" + "\n" + this["クラススキル5効果"];}
            if (this["クラススキル6名"] != "") {classSkill += "\n" + "【" + this["クラススキル6名"] + "】" + "\n" + this["クラススキル6効果"];}
            if (this["クラススキル7名"] != "") {classSkill += "\n" + "【" + this["クラススキル7名"] + "】" + "\n" + this["クラススキル7効果"];}
            $("#servant_search_classSkill")[0].innerText = classSkill;
            // アペンドスキル
            let appendSkill = "【" + this["アペンド名"] + "】" + "\n" + this["アペンド効果"];
            $("#servant_search_appendSkill")[0].innerText = appendSkill;
            // 絆
            $("#servant_search_bondCE")[0].innerText = this["絆礼装効果"];
            // 特性
            $("#servant_search_trait")[0].innerText = this["特性"];

            return;
        }

    });
}

/**
 * プリセットセレクトボックス再作成
 */
function remakePresetSelectBox() {

    // プリセットセレクトボックスを削除
    while ($("#buffPreset_name")[0].lastChild) {
        $("#buffPreset_name")[0].removeChild($("#buffPreset_name")[0].lastChild);
        $("#buffPreset_sel_name")[0].removeChild($("#buffPreset_sel_name")[0].lastChild);
    }

    $(buffPresetDataList).each(function() {
        var option = document.createElement("option");
        var sel = document.createElement("option");
        option.value = this.id;
        option.textContent = this.name;
        option.dataset.pin_flag = this.pin_flag;
        sel.value = this.id;
        sel.textContent = this.name
        $("#buffPreset_name")[0].appendChild(option);
        $("#buffPreset_sel_name")[0].appendChild(sel);

    });

    // ソート
    selectBoxSort("#buffPreset_name option");
    selectBoxSort("#buffPreset_sel_name option");

    // 最初のoptionを選択
    if ($("#buffPreset_name")[0].firstChild != null) {
        $("#buffPreset_name").val($("#buffPreset_name")[0].firstChild.value);
        $("#buffPreset_sel_name").val($("#buffPreset_sel_name")[0].firstChild.value);
    }

}

/**
 * ピン留め再作成
 */
function pinBuffCreate() {

    var parent = document.getElementsByClassName("pin_buff_parent"); 
    var li;

    for (let rec = 0; rec < parent.length; ++rec) {
        li = '';
        for (const elem of $("#buffPreset_name option")) {
            if (elem.dataset.pin_flag == "true"){
                li += '<li><a class="dropdown-item pin_buff_link" href="#" data-presetid="' + elem.value + '" data-targetrec="' + rec + '" tabindex="-1">' + elem.text + '</a></li>';
            }
        }
        if (li != ''){
            parent[rec].getElementsByClassName("dropdown-menu")[0].innerHTML = li;
        }
        else {
            parent[rec].getElementsByClassName("dropdown-menu")[0].innerHTML = '<li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#buffPresetModal" id="goBuffPreset" tabindex="-1">ピン留め設定</a></li>';
        }  

    }

}

/**
 * プリセットセレクトボックスソート
 * @param optionId オプション
 */
function selectBoxSort(optionId) {
    var options = $(optionId);  
    var arr = options.map(function(i, o) {
      return {
        text: $(o).text(),
        val: o.value,
        pin_flag: o.dataset.pin_flag,
        sel: o.selected //true || false
      };
    }).get();

    arr.sort(function(o1, o2) {
      return o1.text > o2.text ? 1 : o1.text < o2.text ? -1 : 0;
    });
    options.each(function(i, o) {
      o.value = arr[i].val;
      $(o).text(arr[i].text);
      o.dataset.pin_flag = arr[i].pin_flag;
      o.selected = arr[i].sel;
      if (o.selected) {
          $(o).attr("selected",true);
      } else {
          $(o).attr("selected",false);
      }
    });
}

/**
 * プリセットデータ設定(更新・削除)
 * @param id プリセットID
 */
function setPresetDataUpdDel(id) {

    if (buffPresetDataList.length == 0) {
        // 初期値を設定
        $("#name_buffPreset_upd_del").val("");
        $("#atk_buff_buffPreset_upd_del").val("0");
        $("#def_debuff_buffPreset_upd_del").val("0");
        $("#b_card_buff_buffPreset_upd_del").val("0");
        $("#a_card_buff_buffPreset_upd_del").val("0");
        $("#q_card_buff_buffPreset_upd_del").val("0");
        $("#b_card_debuff_buffPreset_upd_del").val("0");
        $("#a_card_debuff_buffPreset_upd_del").val("0");
        $("#q_card_debuff_buffPreset_upd_del").val("0");
        $("#b_card_power_buff_buffPreset_upd_del").val("0");
        $("#a_card_power_buff_buffPreset_upd_del").val("0");
        $("#q_card_power_buff_buffPreset_upd_del").val("0");
        $("#cri_buff_buffPreset_upd_del").val("0");
        $("#b_card_cri_buff_buffPreset_upd_del").val("0");
        $("#a_card_cri_buff_buffPreset_upd_del").val("0");
        $("#q_card_cri_buff_buffPreset_upd_del").val("0");
        $("#np_buff_buffPreset_upd_del").val("0");
        $("#ex_atk_buff_buffPreset_upd_del").val("0");
        $("#supereffective_buff_buffPreset_upd_del").val("0");
        $("#fixed_dmg_buffPreset_upd_del").val("0");
        $("#na_buff_buffPreset_upd_del").val("0");
        $("#sr_buff_buffPreset_upd_del").val("0");
        $("#dream_end_buffPreset_upd_del")[0].checked = false;
        $("#pin_flag_upd_del")[0].checked = false;

        return;
    }

    $(buffPresetDataList).each(function() {

        if (this.id == id) {
            try{
                $("#name_buffPreset_upd_del").val(this.name);
                $("#atk_buff_buffPreset_upd_del").val(this.atk_buff);
                $("#def_debuff_buffPreset_upd_del").val(this.def_debuff);
                $("#b_card_buff_buffPreset_upd_del").val(this.b_card_buff);
                $("#a_card_buff_buffPreset_upd_del").val(this.a_card_buff);
                $("#q_card_buff_buffPreset_upd_del").val(this.q_card_buff);
                $("#b_card_debuff_buffPreset_upd_del").val(this.b_card_debuff);
                $("#a_card_debuff_buffPreset_upd_del").val(this.a_card_debuff);
                $("#q_card_debuff_buffPreset_upd_del").val(this.q_card_debuff);
                $("#b_card_power_buff_buffPreset_upd_del").val(this.b_card_power_buff);
                $("#a_card_power_buff_buffPreset_upd_del").val(this.a_card_power_buff);
                $("#q_card_power_buff_buffPreset_upd_del").val(this.q_card_power_buff);
                $("#cri_buff_buffPreset_upd_del").val(this.cri_buff);
                $("#b_card_cri_buff_buffPreset_upd_del").val(this.b_card_cri_buff);
                $("#a_card_cri_buff_buffPreset_upd_del").val(this.a_card_cri_buff);
                $("#q_card_cri_buff_buffPreset_upd_del").val(this.q_card_cri_buff);
                $("#np_buff_buffPreset_upd_del").val(this.np_buff);
                $("#ex_atk_buff_buffPreset_upd_del").val(this.ex_atk_buff);
                $("#supereffective_buff_buffPreset_upd_del").val(this.supereffective_buff);
                $("#fixed_dmg_buffPreset_upd_del").val(this.fixed_dmg);
                $("#na_buff_buffPreset_upd_del").val(this.na_buff);
                $("#sr_buff_buffPreset_upd_del").val(this.sr_buff);
                $("#dream_end_buffPreset_upd_del")[0].checked = this.dream_end;
                $("#pin_flag_upd_del")[0].checked = this.pin_flag;
            }catch{
            }

            return;
        }

    });

}

/**
 * プリセットデータ設定(選択)
 * @param id プリセットID
 */
function setPresetDataSel(id) {

    if (buffPresetDataList.length == 0) {
        // 初期値を設定
        $("#name_buffPreset_sel").val("");
        $("#atk_buff_buffPreset_sel").val("0");
        $("#def_debuff_buffPreset_sel").val("0");
        $("#b_card_buff_buffPreset_sel").val("0");
        $("#a_card_buff_buffPreset_sel").val("0");
        $("#q_card_buff_buffPreset_sel").val("0");
        $("#b_card_debuff_buffPreset_sel").val("0");
        $("#a_card_debuff_buffPreset_sel").val("0");
        $("#q_card_debuff_buffPreset_sel").val("0");
        $("#b_card_power_buff_buffPreset_sel").val("0");
        $("#a_card_power_buff_buffPreset_sel").val("0");
        $("#q_card_power_buff_buffPreset_sel").val("0");
        $("#cri_buff_buffPreset_sel").val("0");
        $("#b_card_cri_buff_buffPreset_sel").val("0");
        $("#a_card_cri_buff_buffPreset_sel").val("0");
        $("#q_card_cri_buff_buffPreset_sel").val("0");
        $("#np_buff_buffPreset_sel").val("0");
        $("#ex_atk_buff_buffPreset_sel").val("0");
        $("#supereffective_buff_buffPreset_sel").val("0");
        $("#fixed_dmg_buffPreset_sel").val("0");
        $("#na_buff_buffPreset_sel").val("0");
        $("#sr_buff_buffPreset_sel").val("0");
        $("#dream_end_buffPreset_sel")[0].checked = false;

        return;
    }

    $(buffPresetDataList).each(function() {

        if (this.id == id) {
            try{
                $("#name_buffPreset_sel").val(this.name);
                $("#atk_buff_buffPreset_sel").val(this.atk_buff);
                $("#def_debuff_buffPreset_sel").val(this.def_debuff);
                $("#b_card_buff_buffPreset_sel").val(this.b_card_buff);
                $("#a_card_buff_buffPreset_sel").val(this.a_card_buff);
                $("#q_card_buff_buffPreset_sel").val(this.q_card_buff);
                $("#b_card_debuff_buffPreset_sel").val(this.b_card_debuff);
                $("#a_card_debuff_buffPreset_sel").val(this.a_card_debuff);
                $("#q_card_debuff_buffPreset_sel").val(this.q_card_debuff);
                $("#b_card_power_buff_buffPreset_sel").val(this.b_card_power_buff);
                $("#a_card_power_buff_buffPreset_sel").val(this.a_card_power_buff);
                $("#q_card_power_buff_buffPreset_sel").val(this.q_card_power_buff);
                $("#cri_buff_buffPreset_sel").val(this.cri_buff);
                $("#b_card_cri_buff_buffPreset_sel").val(this.b_card_cri_buff);
                $("#a_card_cri_buff_buffPreset_sel").val(this.a_card_cri_buff);
                $("#q_card_cri_buff_buffPreset_sel").val(this.q_card_cri_buff);
                $("#np_buff_buffPreset_sel").val(this.np_buff);
                $("#ex_atk_buff_buffPreset_sel").val(this.ex_atk_buff);
                $("#supereffective_buff_buffPreset_sel").val(this.supereffective_buff);
                $("#fixed_dmg_buffPreset_sel").val(this.fixed_dmg);
                $("#na_buff_buffPreset_sel").val(this.na_buff);
                $("#sr_buff_buffPreset_sel").val(this.sr_buff);
                $("#dream_end_buffPreset_sel")[0].checked = this.dream_end;
            }catch{
            }

            return;
        }

    });

}

/**
 * クラススコア設定
 */
function setClassScore() {

    $(classScoreDataList).each(function() {

            $("#b_card_power_buff_classScore_" + this.class).val(this.b_card_power_buff);
            $("#a_card_power_buff_classScore_" + this.class).val(this.a_card_power_buff);
            $("#q_card_power_buff_classScore_" + this.class).val(this.q_card_power_buff);
            $("#cri_buff_classScore_" + this.class).val(this.cri_buff);
            $("#b_card_cri_buff_classScore_" + this.class).val(this.b_card_cri_buff);
            $("#a_card_cri_buff_classScore_" + this.class).val(this.a_card_cri_buff);
            $("#q_card_cri_buff_classScore_" + this.class).val(this.q_card_cri_buff);
            $("#np_buff_classScore_" + this.class).val(this.np_buff);
            $("#ex_atk_buff_classScore_" + this.class).val(this.ex_atk_buff);
            $("#sr_buff_classScore_" + this.class).val(this.sr_buff);

    });

}

/**
 * 計算メイン処理
 * @param recNumber 計算対象行
 */
function calcMain(recNumber) {
    var atk, np_dmg, np_kind, atk_buff, def_debuff, b_card_buff, b_card_debuff, a_card_buff, a_card_debuff, q_card_buff, q_card_debuff,
    cri_buff, b_card_cri_buff, a_card_cri_buff, q_card_cri_buff, np_buff, ex_atk_buff, supereffective_buff, supereffective_np, fixed_dmg,
    b_card_power_buff, a_card_power_buff, q_card_power_buff, b_footprints, a_footprints, q_footprints, special_def,
    advanced_atk_buff_1st, advanced_atk_buff_2nd, advanced_atk_buff_3rd, advanced_atk_buff_ex,
    advanced_def_debuff_1st, advanced_def_debuff_2nd, advanced_def_debuff_3rd, advanced_def_debuff_ex,
    advanced_supereffective_buff_1st, advanced_supereffective_buff_2nd, advanced_supereffective_buff_3rd, advanced_supereffective_buff_ex,
    advanced_fixed_dmg_1st, advanced_fixed_dmg_2nd, advanced_fixed_dmg_3rd, advanced_fixed_dmg_ex, 
    advanced_special_def_1st, advanced_special_def_2nd, advanced_special_def_3rd, advanced_special_def_ex,
    advanced_card_buff_1st, advanced_card_buff_2nd, advanced_card_buff_3rd,
    advanced_card_debuff_1st, advanced_card_debuff_2nd, advanced_card_debuff_3rd,
    advanced_cri_buff_1st, advanced_cri_buff_2nd, advanced_cri_buff_3rd,
    class_affinity, attribute_affinity, class_servant, card_1st, card_1st_cri, card_2nd, card_2nd_cri, card_3rd, card_3rd_cri, ex_cri,
    bbonus_1st, bbonus_2nd, bbonus_3rd, exbonus, bbonus_all, bchain_bonus, atk_1st, atk_2nd, atk_3rd, card_buff_1st, card_buff_2nd, card_buff_3rd,
    supereffective_buff_1st, supereffective_buff_2nd, supereffective_buff_3rd, supereffective_buff_ex,
    fixed_dmg_1st, fixed_dmg_2nd, fixed_dmg_3rd, fixed_dmg_ex, special_def_1st, special_def_2nd, special_def_3rd, special_def_ex,
    atk_buff_1st, atk_buff_2nd, atk_buff_3rd, atk_buff_ex,
    cri_buff_1st, cri_buff_2nd, cri_buff_3rd, np_card_buff,
    dmg_ave_1st, dmg_ave_2nd, dmg_ave_3rd, dmg_ave_EX,
    dmg_max_1st, dmg_max_2nd, dmg_max_3rd, dmg_max_EX,
    dmg_min_1st, dmg_min_2nd, dmg_min_3rd, dmg_min_EX,
    dmg_cri_ave_1st, dmg_cri_ave_2nd, dmg_cri_ave_3rd,
    dmg_cri_max_1st, dmg_cri_max_2nd, dmg_cri_max_3rd,
    dmg_cri_min_1st, dmg_cri_min_2nd, dmg_cri_min_3rd;

    // 計算パラメーター取得
    atk = parseFloat($("#atk_" + recNumber).val());
    np_dmg = parseFloat($("#np_dmg_" + recNumber).val());
    np_kind = $("#np_kind_" + recNumber).val();
    atk_buff = parseFloat($("#atk_buff_" + recNumber).val());
    def_debuff = parseFloat($("#def_debuff_" + recNumber).val());
    b_card_buff = parseFloat($("#b_card_buff_" + recNumber).val());
    b_card_debuff = parseFloat($("#b_card_debuff_" + recNumber).val());
    b_card_cri_buff = parseFloat($("#b_card_cri_buff_" + recNumber).val());
    a_card_buff = parseFloat($("#a_card_buff_" + recNumber).val());
    a_card_debuff = parseFloat($("#a_card_debuff_" + recNumber).val());
    a_card_cri_buff = parseFloat($("#a_card_cri_buff_" + recNumber).val());
    q_card_buff = parseFloat($("#q_card_buff_" + recNumber).val());
    q_card_debuff = parseFloat($("#q_card_debuff_" + recNumber).val());
    q_card_cri_buff = parseFloat($("#q_card_cri_buff_" + recNumber).val());
    b_card_power_buff = parseFloat($("#b_card_power_buff_" + recNumber).val());
    a_card_power_buff = parseFloat($("#a_card_power_buff_" + recNumber).val());
    q_card_power_buff = parseFloat($("#q_card_power_buff_" + recNumber).val());
    cri_buff = parseFloat($("#cri_buff_" + recNumber).val());
    np_buff = parseFloat($("#np_buff_" + recNumber).val());
    ex_atk_buff = parseFloat($("#ex_atk_buff_" + recNumber).val());
    supereffective_buff = parseFloat($("#supereffective_buff_" + recNumber).val());
    supereffective_np = parseFloat($("#supereffective_np_" + recNumber).val());
    fixed_dmg = parseFloat($("#fixed_dmg_" + recNumber).val());
    b_footprints = parseFloat($("#b_footprints_" + recNumber).val());
    a_footprints = parseFloat($("#a_footprints_" + recNumber).val());
    q_footprints = parseFloat($("#q_footprints_" + recNumber).val());
    special_def = parseFloat($("#special_def_" + recNumber).val());
    advanced_atk_buff_1st = parseFloat($("#advanced_atk_buff_1st_" + recNumber).val());
    advanced_atk_buff_2nd = parseFloat($("#advanced_atk_buff_2nd_" + recNumber).val());
    advanced_atk_buff_3rd = parseFloat($("#advanced_atk_buff_3rd_" + recNumber).val());
    advanced_atk_buff_ex = parseFloat($("#advanced_atk_buff_Ex_" + recNumber).val());
    advanced_def_debuff_1st = parseFloat($("#advanced_def_debuff_1st_" + recNumber).val());
    advanced_def_debuff_2nd = parseFloat($("#advanced_def_debuff_2nd_" + recNumber).val());
    advanced_def_debuff_3rd = parseFloat($("#advanced_def_debuff_3rd_" + recNumber).val());
    advanced_def_debuff_ex = parseFloat($("#advanced_def_debuff_Ex_" + recNumber).val());
    advanced_card_buff_1st = parseFloat($("#advanced_card_buff_1st_" + recNumber).val());
    advanced_card_buff_2nd = parseFloat($("#advanced_card_buff_2nd_" + recNumber).val());
    advanced_card_buff_3rd = parseFloat($("#advanced_card_buff_3rd_" + recNumber).val());
    advanced_card_debuff_1st = parseFloat($("#advanced_card_debuff_1st_" + recNumber).val());
    advanced_card_debuff_2nd = parseFloat($("#advanced_card_debuff_2nd_" + recNumber).val());
    advanced_card_debuff_3rd = parseFloat($("#advanced_card_debuff_3rd_" + recNumber).val());
    advanced_cri_buff_1st = parseFloat($("#advanced_cri_buff_1st_" + recNumber).val());
    advanced_cri_buff_2nd = parseFloat($("#advanced_cri_buff_2nd_" + recNumber).val());
    advanced_cri_buff_3rd = parseFloat($("#advanced_cri_buff_3rd_" + recNumber).val());
    advanced_supereffective_buff_1st = parseFloat($("#advanced_supereffective_buff_1st_" + recNumber).val());
    advanced_supereffective_buff_2nd = parseFloat($("#advanced_supereffective_buff_2nd_" + recNumber).val());
    advanced_supereffective_buff_3rd = parseFloat($("#advanced_supereffective_buff_3rd_" + recNumber).val());
    advanced_supereffective_buff_ex = parseFloat($("#advanced_supereffective_buff_Ex_" + recNumber).val());
    advanced_fixed_dmg_1st = parseFloat($("#advanced_fixed_dmg_1st_" + recNumber).val());
    advanced_fixed_dmg_2nd = parseFloat($("#advanced_fixed_dmg_2nd_" + recNumber).val());
    advanced_fixed_dmg_3rd = parseFloat($("#advanced_fixed_dmg_3rd_" + recNumber).val());
    advanced_fixed_dmg_ex = parseFloat($("#advanced_fixed_dmg_Ex_" + recNumber).val());
    advanced_special_def_1st = parseFloat($("#advanced_special_def_1st_" + recNumber).val());
    advanced_special_def_2nd = parseFloat($("#advanced_special_def_2nd_" + recNumber).val());
    advanced_special_def_3rd = parseFloat($("#advanced_special_def_3rd_" + recNumber).val());
    advanced_special_def_ex = parseFloat($("#advanced_special_def_Ex_" + recNumber).val());
    class_affinity = parseFloat($("#class_affinity_" + recNumber).val());
    attribute_affinity = parseFloat($("#attribute_affinity_" + recNumber).val());
    class_servant = parseFloat($("#class_servant_" + recNumber).val());
    card_1st = $("#card_1st_" + recNumber).val();
    card_1st_cri = $("#card_1st_cri_" + recNumber).val();
    card_2nd = $("#card_2nd_" + recNumber).val();
    card_2nd_cri = $("#card_2nd_cri_" + recNumber).val();
    card_3rd = $("#card_3rd_" + recNumber).val();
    card_3rd_cri = $("#card_3rd_cri_" + recNumber).val();
    ex_cri = $("#ex_cri_" + recNumber).val();

    bbonus_all = 0; bchain_bonus = 0; exbonus = 200;

    if (ex_atk_buff > 400) { ex_atk_buff = 400; };
    if (q_card_power_buff > 400) {q_card_power_buff = 400; };
    if (a_card_power_buff > 400) {a_card_power_buff = 400; };
    if (b_card_power_buff > 400) {b_card_power_buff = 400; };
    if (np_buff > 500) {np_buff = 500; };
    if (np_buff < -100) {np_buff = -100; };
    if (ex_atk_buff > 400) { ex_atk_buff = 400 };

    // カード選択ボーナスを設定
    // 1st
    let tmp_card_buff_1st;
    if (card_1st == "Q") {
        bbonus_1st = 80;
        tmp_card_buff_1st = q_card_buff;
        if (q_card_buff + advanced_card_buff_1st > 400) {
            tmp_card_buff_1st = 400;
            advanced_card_buff_1st = 0;
        }
        else if (q_card_buff + advanced_card_buff_1st < -100) {
            tmp_card_buff_1st = -100;
            advanced_card_buff_1st = 0;
        };
        if (cri_buff + q_card_cri_buff + advanced_cri_buff_1st > 500){
            cri_buff_1st = 500;
        }
        else {
            cri_buff_1st = cri_buff + q_card_cri_buff + advanced_cri_buff_1st;
        }
        card_buff_1st = tmp_card_buff_1st + q_card_debuff + advanced_card_buff_1st + advanced_card_debuff_1st + q_card_power_buff;
        atk_1st = atk + q_footprints;
    }
    if (card_1st == "A") {
        bbonus_1st = 100;
        tmp_card_buff_1st = a_card_buff;
        if (a_card_buff + advanced_card_buff_1st > 400) {
            tmp_card_buff_1st = 400;
            advanced_card_buff_1st = 0;
        }
        else if (a_card_buff + advanced_card_buff_1st < -100) {
            tmp_card_buff_1st = -100;
            advanced_card_buff_1st = 0;
        };
        if (cri_buff + a_card_cri_buff + advanced_cri_buff_1st > 500){
            cri_buff_1st = 500;
        }
        else {
            cri_buff_1st = cri_buff + a_card_cri_buff + advanced_cri_buff_1st;
        }
        card_buff_1st = tmp_card_buff_1st + a_card_debuff + advanced_card_buff_1st + advanced_card_debuff_1st + a_card_power_buff;
        atk_1st = atk + a_footprints;
    }
    if (card_1st == "B") {
        bbonus_all = 50;
        bbonus_1st = 150;
        tmp_card_buff_1st = b_card_buff;
        if (b_card_buff + advanced_card_buff_1st > 400) {
            tmp_card_buff_1st = 400;
            advanced_card_buff_1st = 0;
        }
        else if (b_card_buff + advanced_card_buff_1st < -100) {
            tmp_card_buff_1st = -100;
            advanced_card_buff_1st = 0;
        };
        if (cri_buff + b_card_cri_buff + advanced_cri_buff_1st > 500){
            cri_buff_1st = 500;
        }
        else {
            cri_buff_1st = cri_buff + b_card_cri_buff + advanced_cri_buff_1st;
        }
        card_buff_1st = tmp_card_buff_1st + b_card_debuff + advanced_card_buff_1st + advanced_card_debuff_1st + b_card_power_buff;
        atk_1st = atk + b_footprints;
    }
    if (card_1st == "NP" && np_kind == "Q") {
        tmp_card_buff_1st = q_card_buff;
        if (q_card_buff + advanced_card_buff_1st > 400) {
            tmp_card_buff_1st = 400;
            advanced_card_buff_1st = 0;
        }
        else if (q_card_buff + advanced_card_buff_1st < -100) {
            tmp_card_buff_1st = -100;
            advanced_card_buff_1st = 0;
        };
        if (cri_buff + q_card_cri_buff + advanced_cri_buff_1st > 500){
            cri_buff_1st = 500;
        }
        else {
            cri_buff_1st = cri_buff + q_card_cri_buff + advanced_cri_buff_1st;
        }
        np_card_buff = tmp_card_buff_1st + q_card_debuff + advanced_card_buff_1st + advanced_card_debuff_1st + q_card_power_buff;
        bbonus_1st = 80;
        card_buff_1st = tmp_card_buff_1st + q_card_debuff + advanced_card_buff_1st + advanced_card_debuff_1st + q_card_power_buff;
    }
    if (card_1st == "NP" && np_kind == "A") {
        tmp_card_buff_1st = a_card_buff;
        if (a_card_buff + advanced_card_buff_1st > 400) {
            tmp_card_buff_1st = 400;
            advanced_card_buff_1st = 0;
        }
        else if (a_card_buff + advanced_card_buff_1st < -100) {
            tmp_card_buff_1st = -100;
            advanced_card_buff_1st = 0;
        };
        if (cri_buff + a_card_cri_buff + advanced_cri_buff_1st > 500){
            cri_buff_1st = 500;
        }
        else {
            cri_buff_1st = cri_buff + a_card_cri_buff + advanced_cri_buff_1st;
        }
        np_card_buff = tmp_card_buff_1st + a_card_debuff + advanced_card_buff_1st + advanced_card_debuff_1st + a_card_power_buff;
        bbonus_1st = 100;
        card_buff_1st = tmp_card_buff_1st + a_card_debuff + advanced_card_buff_1st + advanced_card_debuff_1st + a_card_power_buff;
    }
    if (card_1st == "NP" && np_kind == "B") {
        tmp_card_buff_1st = b_card_buff;
        if (b_card_buff + advanced_card_buff_1st > 400) {
            tmp_card_buff_1st = 400;
            advanced_card_buff_1st = 0;
        }
        else if (b_card_buff + advanced_card_buff_1st < -100) {
            tmp_card_buff_1st = -100;
            advanced_card_buff_1st = 0;
        };
        if (cri_buff + b_card_cri_buff + advanced_cri_buff_1st > 500){
            cri_buff_1st = 500;
        }
        else {
            cri_buff_1st = cri_buff + b_card_cri_buff + advanced_cri_buff_1st;
        }
        np_card_buff = tmp_card_buff_1st + b_card_debuff + advanced_card_buff_1st + advanced_card_debuff_1st + b_card_power_buff;
        bbonus_all = 50;
        bbonus_1st = 150;
        card_buff_1st = tmp_card_buff_1st + b_card_debuff + advanced_card_buff_1st + advanced_card_debuff_1st + b_card_power_buff;
    }
    // 2nd
    let tmp_card_buff_2nd;
    if (card_2nd == "Q") {
        bbonus_2nd = 96;
        tmp_card_buff_2nd = q_card_buff;
        if (q_card_buff + advanced_card_buff_2nd > 400) {
            tmp_card_buff_2nd = 400;
            advanced_card_buff_2nd = 0;
        }
        else if (q_card_buff + advanced_card_buff_2nd < -100) {
            tmp_card_buff_2nd = -100;
            advanced_card_buff_2nd = 0;
        };
        if (cri_buff + q_card_cri_buff + advanced_cri_buff_2nd > 500){
            cri_buff_2nd = 500;
        }
        else {
            cri_buff_2nd = cri_buff + q_card_cri_buff + advanced_cri_buff_2nd;
        }
        card_buff_2nd = tmp_card_buff_2nd + q_card_debuff + advanced_card_buff_2nd + advanced_card_debuff_2nd + q_card_power_buff;
        atk_2nd = atk + q_footprints;
    }
    if (card_2nd == "A") {
        bbonus_2nd = 120;
        tmp_card_buff_2nd = a_card_buff;
        if (a_card_buff + advanced_card_buff_2nd > 400) {
            tmp_card_buff_2nd = 400;
            advanced_card_buff_2nd = 0;
        }
        else if (a_card_buff + advanced_card_buff_2nd < -100) {
            tmp_card_buff_2nd = -100;
            advanced_card_buff_2nd = 0;
        };
        if (cri_buff + a_card_cri_buff + advanced_cri_buff_2nd > 500){
            cri_buff_2nd = 500;
        }
        else {
            cri_buff_2nd = cri_buff + a_card_cri_buff + advanced_cri_buff_2nd;
        }
        card_buff_2nd = tmp_card_buff_2nd + a_card_debuff + advanced_card_buff_2nd + advanced_card_debuff_2nd + a_card_power_buff;
        atk_2nd = atk + a_footprints;
    }
    if (card_2nd == "B") {
        bbonus_2nd = 180;
        tmp_card_buff_2nd = b_card_buff;
        if (b_card_buff + advanced_card_buff_2nd > 400) {
            tmp_card_buff_2nd = 400;
            advanced_card_buff_2nd = 0;
        }
        else if (b_card_buff + advanced_card_buff_2nd < -100) {
            tmp_card_buff_2nd = -100;
            advanced_card_buff_2nd = 0;
        };
        if (cri_buff + b_card_cri_buff + advanced_cri_buff_2nd > 500){
            cri_buff_2nd = 500;
        }
        else {
            cri_buff_2nd = cri_buff + b_card_cri_buff + advanced_cri_buff_2nd;
        }
        card_buff_2nd = tmp_card_buff_2nd + b_card_debuff + advanced_card_buff_2nd + advanced_card_debuff_2nd + b_card_power_buff;
        atk_2nd = atk + b_footprints;
    }
    if (card_2nd == "NP" && np_kind == "Q") {
        tmp_card_buff_2nd = q_card_buff;
        if (q_card_buff + advanced_card_buff_2nd > 400) {
            tmp_card_buff_2nd = 400;
            advanced_card_buff_2nd = 0;
        }
        else if (q_card_buff + advanced_card_buff_2nd < -100) {
            tmp_card_buff_2nd = -100;
            advanced_card_buff_2nd = 0;
        };
        if (cri_buff + q_card_cri_buff + advanced_cri_buff_2nd > 500){
            cri_buff_2nd = 500;
        }
        else {
            cri_buff_2nd = cri_buff + q_card_cri_buff + advanced_cri_buff_2nd;
        }
        np_card_buff = tmp_card_buff_2nd + q_card_debuff + advanced_card_buff_2nd + advanced_card_debuff_2nd + q_card_power_buff;
        bbonus_2nd = 96;
        card_buff_2nd = tmp_card_buff_2nd + q_card_debuff + advanced_card_buff_2nd + advanced_card_debuff_2nd + q_card_power_buff;
    }
    if (card_2nd == "NP" && np_kind == "A") {
        tmp_card_buff_2nd = a_card_buff;
        if (a_card_buff + advanced_card_buff_2nd > 400) {
            tmp_card_buff_2nd = 400;
            advanced_card_buff_2nd = 0;
        }
        else if (a_card_buff + advanced_card_buff_2nd < -100) {
            tmp_card_buff_2nd = -100;
            advanced_card_buff_2nd = 0;
        };
        if (cri_buff + a_card_cri_buff + advanced_cri_buff_2nd > 500){
            cri_buff_2nd = 500;
        }
        else {
            cri_buff_2nd = cri_buff + a_card_cri_buff + advanced_cri_buff_2nd;
        }
        np_card_buff = tmp_card_buff_2nd + a_card_debuff + advanced_card_buff_2nd + advanced_card_debuff_2nd + a_card_power_buff;
        bbonus_2nd = 120;
        card_buff_2nd = tmp_card_buff_2nd + a_card_debuff + advanced_card_buff_2nd + advanced_card_debuff_2nd + a_card_power_buff;
    }
    if (card_2nd == "NP" && np_kind == "B") {
        tmp_card_buff_2nd = b_card_buff;
        if (b_card_buff + advanced_card_buff_2nd > 400) {
            tmp_card_buff_2nd = 400;
            advanced_card_buff_2nd = 0;
        }
        else if (b_card_buff + advanced_card_buff_2nd < -100) {
            tmp_card_buff_2nd = -100;
            advanced_card_buff_2nd = 0;
        };
        if (cri_buff + b_card_cri_buff + advanced_cri_buff_2nd > 500){
            cri_buff_2nd = 500;
        }
        else {
            cri_buff_2nd = cri_buff + b_card_cri_buff + advanced_cri_buff_2nd;
        }
        np_card_buff = tmp_card_buff_2nd + b_card_debuff + advanced_card_buff_2nd + advanced_card_debuff_2nd + b_card_power_buff;
        bbonus_2nd = 180;
        card_buff_2nd = tmp_card_buff_2nd + b_card_debuff + advanced_card_buff_2nd + advanced_card_debuff_2nd + b_card_power_buff;
    }
    // 3rd
    let tmp_card_buff_3rd;
    if (card_3rd == "Q") {
        bbonus_3rd = 112;
        tmp_card_buff_3rd = q_card_buff;
        if (q_card_buff + advanced_card_buff_3rd > 400) {
            tmp_card_buff_3rd = 400;
            advanced_card_buff_3rd = 0;
        }
        else if (q_card_buff + advanced_card_buff_3rd < -100) {
            tmp_card_buff_3rd = -100;
            advanced_card_buff_3rd = 0;
        };
        if (cri_buff + q_card_cri_buff + advanced_cri_buff_3rd > 500){
            cri_buff_3rd = 500;
        }
        else {
            cri_buff_3rd = cri_buff + q_card_cri_buff + advanced_cri_buff_3rd;
        }
        card_buff_3rd = tmp_card_buff_3rd + q_card_debuff + advanced_card_buff_3rd + advanced_card_debuff_3rd + q_card_power_buff;
        atk_3rd = atk + q_footprints;
    }
    if (card_3rd == "A") {
        bbonus_3rd = 140;
        tmp_card_buff_3rd = a_card_buff;
        if (a_card_buff + advanced_card_buff_3rd > 400) {
            tmp_card_buff_3rd = 400;
            advanced_card_buff_3rd = 0;
        }
        else if (a_card_buff + advanced_card_buff_3rd < -100) {
            tmp_card_buff_3rd = -100;
            advanced_card_buff_3rd = 0;
        };
        if (cri_buff + a_card_cri_buff + advanced_cri_buff_3rd > 500){
            cri_buff_3rd = 500;
        }
        else {
            cri_buff_3rd = cri_buff + a_card_cri_buff + advanced_cri_buff_3rd;
        }
        card_buff_3rd = tmp_card_buff_3rd + a_card_debuff + advanced_card_buff_3rd + advanced_card_debuff_3rd + a_card_power_buff;
        atk_3rd = atk + a_footprints;
    }
    if (card_3rd == "B") {
        bbonus_3rd = 210;
        tmp_card_buff_3rd = b_card_buff;
        if (b_card_buff + advanced_card_buff_3rd > 400) {
            tmp_card_buff_3rd = 400;
            advanced_card_buff_3rd = 0;
        }
        else if (b_card_buff + advanced_card_buff_3rd < -100) {
            tmp_card_buff_3rd = -100;
            advanced_card_buff_3rd = 0;
        };
        if (cri_buff + b_card_cri_buff + advanced_cri_buff_3rd > 500){
            cri_buff_3rd = 500;
        }
        else {
            cri_buff_3rd = cri_buff + b_card_cri_buff + advanced_cri_buff_3rd;
        }
        card_buff_3rd = tmp_card_buff_3rd + b_card_debuff + advanced_card_buff_3rd + advanced_card_debuff_3rd + b_card_power_buff;
        atk_3rd = atk + b_footprints;
    }
    if (card_3rd == "NP" && np_kind == "Q") {
        tmp_card_buff_3rd = q_card_buff;
        if (q_card_buff + advanced_card_buff_3rd > 400) {
            tmp_card_buff_3rd = 400;
            advanced_card_buff_3rd = 0;
        }
        else if (q_card_buff + advanced_card_buff_3rd < -100) {
            tmp_card_buff_3rd = -100;
            advanced_card_buff_3rd = 0;
        };
        if (cri_buff + q_card_cri_buff + advanced_cri_buff_3rd > 500){
            cri_buff_3rd = 500;
        }
        else {
            cri_buff_3rd = cri_buff + q_card_cri_buff + advanced_cri_buff_3rd;
        }
        np_card_buff = tmp_card_buff_3rd + q_card_debuff + advanced_card_buff_3rd + advanced_card_debuff_3rd + q_card_power_buff;
        bbonus_3rd = 112;
        card_buff_3rd = tmp_card_buff_3rd + q_card_debuff + advanced_card_buff_3rd + advanced_card_debuff_3rd + q_card_power_buff;
    }
    if (card_3rd == "NP" && np_kind == "A") {
        tmp_card_buff_3rd = a_card_buff;
        if (a_card_buff + advanced_card_buff_3rd > 400) {
            tmp_card_buff_3rd = 400;
            advanced_card_buff_3rd = 0;
        }
        else if (a_card_buff + advanced_card_buff_3rd < -100) {
            tmp_card_buff_3rd = -100;
            advanced_card_buff_3rd = 0;
        };
        if (cri_buff + a_card_cri_buff + advanced_cri_buff_3rd > 500){
            cri_buff_3rd = 500;
        }
        else {
            cri_buff_3rd = cri_buff + a_card_cri_buff + advanced_cri_buff_3rd;
        }
        np_card_buff = tmp_card_buff_3rd + a_card_debuff + advanced_card_buff_3rd + advanced_card_debuff_3rd + a_card_power_buff;
        bbonus_3rd = 140;
        card_buff_3rd = tmp_card_buff_3rd + a_card_debuff + advanced_card_buff_3rd + advanced_card_debuff_3rd + a_card_power_buff;
    }
    if (card_3rd == "NP" && np_kind == "B") {
        tmp_card_buff_3rd = b_card_buff;
        if (b_card_buff + advanced_card_buff_3rd > 400) {
            tmp_card_buff_3rd = 400;
            advanced_card_buff_3rd = 0;
        }
        else if (b_card_buff + advanced_card_buff_3rd < -100) {
            tmp_card_buff_3rd = -100;
            advanced_card_buff_3rd = 0;
        };
        if (cri_buff + b_card_cri_buff + advanced_cri_buff_3rd > 500){
            cri_buff_3rd = 500;
        }
        else {
            cri_buff_3rd = cri_buff + b_card_cri_buff + advanced_cri_buff_3rd;
        }
        np_card_buff = tmp_card_buff_3rd + b_card_debuff + advanced_card_buff_3rd + advanced_card_debuff_3rd + b_card_power_buff;
        bbonus_3rd = 210;
        card_buff_3rd = tmp_card_buff_3rd + b_card_debuff + advanced_card_buff_3rd + advanced_card_debuff_3rd + b_card_power_buff;
    }
    // 1st共通
    let tmp_atk_buff_1st = atk_buff;
    let tmp_def_debuff_1st = def_debuff;
    if (atk_buff + advanced_atk_buff_1st > 400) {
        tmp_atk_buff_1st = 400;
        advanced_atk_buff_1st = 0;
    }
    else if (atk_buff + advanced_atk_buff_1st < -100) {
        tmp_atk_buff_1st = -100;
        advanced_atk_buff_1st = 0;
    };
    if (def_debuff + advanced_def_debuff_1st > 100) { tmp_def_debuff_1st = 100; advanced_def_debuff_1st = 0; };
    if (supereffective_buff + advanced_supereffective_buff_1st > 1000) {
        supereffective_buff_1st = 1000;
    }
    else {
        supereffective_buff_1st = supereffective_buff + advanced_supereffective_buff_1st;
    };
    atk_buff_1st = tmp_atk_buff_1st + tmp_def_debuff_1st + advanced_atk_buff_1st + advanced_def_debuff_1st;
    fixed_dmg_1st = fixed_dmg + advanced_fixed_dmg_1st;
    special_def_1st = special_def + advanced_special_def_1st;
    // 2nd共通
    let tmp_atk_buff_2nd = atk_buff;
    let tmp_def_debuff_2nd = def_debuff;
    if (atk_buff + advanced_atk_buff_2nd > 400) {
        tmp_atk_buff_2nd = 400;
        advanced_atk_buff_2nd = 0;
    }
    else if (atk_buff + advanced_atk_buff_2nd < -100) {
        tmp_atk_buff_2nd = -100;
        advanced_atk_buff_2nd = 0;
    };
    if (def_debuff + advanced_def_debuff_2nd > 100) { tmp_def_debuff_2nd = 100; advanced_def_debuff_2nd = 0; };
    if (supereffective_buff + advanced_supereffective_buff_2nd > 1000) {
        supereffective_buff_2nd = 1000;
    }
    else {
        supereffective_buff_2nd = supereffective_buff + advanced_supereffective_buff_2nd;
    };
    atk_buff_2nd = tmp_atk_buff_2nd + tmp_def_debuff_2nd + advanced_atk_buff_2nd + advanced_def_debuff_2nd;
    fixed_dmg_2nd = fixed_dmg + advanced_fixed_dmg_2nd;
    special_def_2nd = special_def + advanced_special_def_2nd;
    // 3rd共通
    let tmp_atk_buff_3rd = atk_buff;
    let tmp_def_debuff_3rd = def_debuff;
    if (atk_buff + advanced_atk_buff_3rd > 400) {
        tmp_atk_buff_3rd = 400;
        advanced_atk_buff_3rd = 0;
    }
    else if (atk_buff + advanced_atk_buff_3rd < -100) {
        tmp_atk_buff_3rd = -100;
        advanced_atk_buff_3rd = 0;
    };
    if (def_debuff + advanced_def_debuff_3rd > 100) { tmp_def_debuff_3rd = 100; advanced_def_debuff_3rd = 0; };
    if (supereffective_buff + advanced_supereffective_buff_3rd > 1000) {
        supereffective_buff_3rd = 1000;
    }
    else {
        supereffective_buff_3rd = supereffective_buff + advanced_supereffective_buff_3rd;
    };
    atk_buff_3rd = tmp_atk_buff_3rd + tmp_def_debuff_3rd + advanced_atk_buff_3rd + advanced_def_debuff_3rd;
    fixed_dmg_3rd = fixed_dmg + advanced_fixed_dmg_3rd;
    special_def_3rd = special_def + advanced_special_def_3rd;
    // EX共通
    let tmp_atk_buff_ex = atk_buff;
    let tmp_def_debuff_ex = def_debuff;
    if (atk_buff + advanced_atk_buff_ex > 400) {
        tmp_atk_buff_ex = 400;
        advanced_atk_buff_ex = 0;
    }
    else if (atk_buff + advanced_atk_buff_ex < -100) {
        tmp_atk_buff_ex = -100;
        advanced_atk_buff_ex = 0;
    };
    if (def_debuff + advanced_def_debuff_ex > 100) { tmp_def_debuff_ex = 100; advanced_def_debuff_ex = 0; };
    if (supereffective_buff + advanced_supereffective_buff_ex > 1000) {
        supereffective_buff_ex = 1000;
    }
    else {
        supereffective_buff_ex = supereffective_buff + advanced_supereffective_buff_ex;
    };
    atk_buff_ex = tmp_atk_buff_ex + tmp_def_debuff_ex + advanced_atk_buff_ex + advanced_def_debuff_ex;
    fixed_dmg_ex = fixed_dmg + advanced_fixed_dmg_ex;
    special_def_ex = special_def + advanced_special_def_ex;
    
    
    // 各種ボーナス
    if (card_1st == "NP") {
        if ((np_kind != card_2nd && card_2nd != card_3rd && card_3rd != np_kind) || np_kind == "B") { bbonus_all = 50; }
        if (np_kind == card_2nd && card_2nd == card_3rd && np_kind == "B") { exbonus = 350; bchain_bonus = 20; }
        if (np_kind == card_2nd && card_2nd == card_3rd) { exbonus = 350; };
    } else if(card_2nd == "NP") {
        if ((card_1st != np_kind && np_kind != card_3rd && card_3rd != card_1st) || card_1st == "B") { bbonus_all = 50; }
        if (card_1st == np_kind && np_kind == card_3rd && card_1st == "B") { exbonus = 350; bchain_bonus = 20; }
        if (card_1st == np_kind && np_kind == card_3rd) { exbonus = 350; };
    } else if(card_3rd == "NP") {
        if ((card_1st != card_2nd && card_2nd != np_kind && np_kind != card_1st) || card_1st == "B") { bbonus_all = 50; }
        if (card_1st == card_2nd && card_2nd == np_kind && card_1st == "B") { exbonus = 350; bchain_bonus = 20; }
        if (card_1st == card_2nd && card_2nd == np_kind) { exbonus = 350; };
    } else {
        if (card_1st == card_2nd && card_2nd == card_3rd && card_1st == "B") { exbonus = 350; bchain_bonus = 20; }
        if (card_1st == card_2nd && card_2nd == card_3rd) { exbonus = 350; };
        if ((card_1st != card_2nd && card_2nd != card_3rd && card_3rd != card_1st) || card_1st == "B") { bbonus_all = 50; }
    };

    // 1st計算
    if (card_1st == "NP") {
        dmg_ave_1st = calcNpDmg(atk, np_dmg, np_kind, card_buff_1st, class_affinity, class_servant, attribute_affinity, atk_buff_1st,
            supereffective_buff_1st, np_buff, supereffective_np, fixed_dmg_1st, special_def_1st, 1);
        dmg_min_1st = calcNpDmg(atk, np_dmg, np_kind, card_buff_1st, class_affinity, class_servant, attribute_affinity, atk_buff_1st,
            supereffective_buff_1st, np_buff, supereffective_np, fixed_dmg_1st, special_def_1st, 0.9);
        dmg_max_1st = calcNpDmg(atk, np_dmg, np_kind, card_buff_1st, class_affinity, class_servant, attribute_affinity, atk_buff_1st,
            supereffective_buff_1st, np_buff, supereffective_np, fixed_dmg_1st, special_def_1st, 1.099);
    } else {
        dmg_ave_1st = calcDmg(atk_1st, atk_buff_1st, card_buff_1st, cri_buff_1st, bbonus_1st, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_1st, special_def_1st, fixed_dmg_1st, 1);
        dmg_min_1st = calcDmg(atk_1st, atk_buff_1st, card_buff_1st, cri_buff_1st, bbonus_1st, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_1st, special_def_1st, fixed_dmg_1st, 0.9);
        dmg_max_1st = calcDmg(atk_1st, atk_buff_1st, card_buff_1st, cri_buff_1st, bbonus_1st, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_1st, special_def_1st, fixed_dmg_1st, 1.099);
        dmg_cri_ave_1st = calcDmg(atk_1st, atk_buff_1st, card_buff_1st, cri_buff_1st, bbonus_1st, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_1st, special_def_1st, fixed_dmg_1st, 1);
        dmg_cri_min_1st = calcDmg(atk_1st, atk_buff_1st, card_buff_1st, cri_buff_1st, bbonus_1st, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_1st, special_def_1st, fixed_dmg_1st, 0.9);
        dmg_cri_max_1st = calcDmg(atk_1st, atk_buff_1st, card_buff_1st, cri_buff_1st, bbonus_1st, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_1st, special_def_1st, fixed_dmg_1st, 1.099);
    };

    // 2nd計算
    if (card_2nd == "NP") {
        dmg_ave_2nd = calcNpDmg(atk, np_dmg, np_kind, card_buff_2nd, class_affinity, class_servant, attribute_affinity, atk_buff_2nd,
            supereffective_buff_2nd, np_buff, supereffective_np, fixed_dmg_2nd, special_def_2nd, 1);
        dmg_min_2nd = calcNpDmg(atk, np_dmg, np_kind, card_buff_2nd, class_affinity, class_servant, attribute_affinity, atk_buff_2nd,
            supereffective_buff_2nd, np_buff, supereffective_np, fixed_dmg_2nd, special_def_2nd, 0.9);
        dmg_max_2nd = calcNpDmg(atk, np_dmg, np_kind, card_buff_2nd, class_affinity, class_servant, attribute_affinity, atk_buff_2nd,
            supereffective_buff_2nd, np_buff, supereffective_np, fixed_dmg_2nd, special_def_2nd, 1.099);
    } else {
        dmg_ave_2nd = calcDmg(atk_2nd, atk_buff_2nd, card_buff_2nd, cri_buff_2nd, bbonus_2nd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_2nd, special_def_2nd, fixed_dmg_2nd, 1);
        dmg_min_2nd = calcDmg(atk_2nd, atk_buff_2nd, card_buff_2nd, cri_buff_2nd, bbonus_2nd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_2nd, special_def_2nd, fixed_dmg_2nd, 0.9);
        dmg_max_2nd = calcDmg(atk_2nd, atk_buff_2nd, card_buff_2nd, cri_buff_2nd, bbonus_2nd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_2nd, special_def_2nd, fixed_dmg_2nd, 1.099);
        dmg_cri_ave_2nd = calcDmg(atk_2nd, atk_buff_2nd, card_buff_2nd, cri_buff_2nd, bbonus_2nd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_2nd, special_def_2nd, fixed_dmg_2nd, 1);
        dmg_cri_min_2nd = calcDmg(atk_2nd, atk_buff_2nd, card_buff_2nd, cri_buff_2nd, bbonus_2nd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_2nd, special_def_2nd, fixed_dmg_2nd, 0.9);
        dmg_cri_max_2nd = calcDmg(atk_2nd, atk_buff_2nd, card_buff_2nd, cri_buff_2nd, bbonus_2nd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_2nd, special_def_2nd, fixed_dmg_2nd, 1.099);
    }

    // 3rd計算
    if (card_3rd == "NP") {
        dmg_ave_3rd = calcNpDmg(atk, np_dmg, np_kind, card_buff_3rd, class_affinity, class_servant, attribute_affinity, atk_buff_3rd,
            supereffective_buff_3rd, np_buff, supereffective_np, fixed_dmg_3rd, special_def_3rd, 1);
        dmg_min_3rd = calcNpDmg(atk, np_dmg, np_kind, card_buff_3rd, class_affinity, class_servant, attribute_affinity, atk_buff_3rd,
            supereffective_buff_3rd, np_buff, supereffective_np, fixed_dmg_3rd, special_def_3rd, 0.9);
        dmg_max_3rd = calcNpDmg(atk, np_dmg, np_kind, card_buff_3rd, class_affinity, class_servant, attribute_affinity, atk_buff_3rd,
            supereffective_buff_3rd, np_buff, supereffective_np, fixed_dmg_3rd, special_def_3rd, 1.099);
    } else {
        dmg_ave_3rd = calcDmg(atk_3rd, atk_buff_3rd, card_buff_3rd, cri_buff_3rd, bbonus_3rd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_3rd, special_def_3rd, fixed_dmg_3rd, 1);
        dmg_min_3rd = calcDmg(atk_3rd, atk_buff_3rd, card_buff_3rd, cri_buff_3rd, bbonus_3rd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_3rd, special_def_3rd, fixed_dmg_3rd, 0.9);
        dmg_max_3rd = calcDmg(atk_3rd, atk_buff_3rd, card_buff_3rd, cri_buff_3rd, bbonus_3rd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_3rd, special_def_3rd, fixed_dmg_3rd, 1.099);
        dmg_cri_ave_3rd = calcDmg(atk_3rd, atk_buff_3rd, card_buff_3rd, cri_buff_3rd, bbonus_3rd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_3rd, special_def_3rd, fixed_dmg_3rd, 1);
        dmg_cri_min_3rd = calcDmg(atk_3rd, atk_buff_3rd, card_buff_3rd, cri_buff_3rd, bbonus_3rd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_3rd, special_def_3rd, fixed_dmg_3rd, 0.9);
        dmg_cri_max_3rd = calcDmg(atk_3rd, atk_buff_3rd, card_buff_3rd, cri_buff_3rd, bbonus_3rd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_3rd, special_def_3rd, fixed_dmg_3rd, 1.099);
    }

    // EX計算
    dmg_ave_EX = calcDmg(atk, atk_buff_ex, ex_atk_buff, cri_buff, 100, bbonus_all, 0, exbonus,
        class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_ex, special_def_ex, fixed_dmg_ex, 1);
    dmg_min_EX = calcDmg(atk, atk_buff_ex, ex_atk_buff, cri_buff, 100, bbonus_all, 0, exbonus,
        class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_ex, special_def_ex, fixed_dmg_ex, 0.9);
    dmg_max_EX = calcDmg(atk, atk_buff_ex, ex_atk_buff, cri_buff, 100, bbonus_all, 0, exbonus,
        class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_ex, special_def_ex, fixed_dmg_ex, 1.099);
    
    // 1stダメージ有無・クリティカル有無を設定
    if (card_1st != "NP" && card_1st_cri == "Y") {
        dmg_ave_1st = dmg_cri_ave_1st;
        dmg_min_1st = dmg_cri_min_1st;
        dmg_max_1st = dmg_cri_max_1st;
    } else if (card_1st == "NP" && np_dmg == "0") {
        dmg_ave_1st = 0;
        dmg_min_1st = 0;
        dmg_max_1st = 0;
    } else if (card_1st_cri == "zero") {
        dmg_ave_1st = 0;
        dmg_min_1st = 0;
        dmg_max_1st = 0;
    };

    // 2ndダメージ有無・クリティカル有無を設定
    if (card_2nd != "NP" && card_2nd_cri == "Y") {
        dmg_ave_2nd = dmg_cri_ave_2nd;
        dmg_min_2nd = dmg_cri_min_2nd;
        dmg_max_2nd = dmg_cri_max_2nd;
    } else if (card_2nd == "NP" && np_dmg == "0") {
        dmg_ave_2nd = 0;
        dmg_min_2nd = 0;
        dmg_max_2nd = 0;
    } else if (card_2nd_cri == "zero") {
        dmg_ave_2nd = 0;
        dmg_min_2nd = 0;
        dmg_max_2nd = 0;
    };

    // 3rdダメージ有無・クリティカル有無を設定
    if (card_3rd != "NP" && card_3rd_cri == "Y") {
        dmg_ave_3rd = dmg_cri_ave_3rd;
        dmg_min_3rd = dmg_cri_min_3rd;
        dmg_max_3rd = dmg_cri_max_3rd;
    } else if (card_3rd == "NP" && np_dmg == "0") {
        dmg_ave_3rd = 0;
        dmg_min_3rd = 0;
        dmg_max_3rd = 0;
    } else if (card_3rd_cri == "zero") {
        dmg_ave_3rd = 0;
        dmg_min_3rd = 0;
        dmg_max_3rd = 0;
    };

    // EXダメージ有無を設定
    if (ex_cri == "zero") {
        dmg_ave_EX = 0;
        dmg_min_EX = 0;
        dmg_max_EX = 0;
    };

    // 計算結果を反映
    $("#dmg_min_1st_" + recNumber).val(Number(rounddown(dmg_min_1st,0)).toLocaleString());
    $("#dmg_ave_1st_" + recNumber).val(Number(rounddown(dmg_ave_1st,0)).toLocaleString());
    $("#dmg_max_1st_" + recNumber).val(Number(rounddown(dmg_max_1st,0)).toLocaleString());
    $("#dmg_min_2nd_" + recNumber).val(Number(rounddown(dmg_min_2nd,0)).toLocaleString());
    $("#dmg_ave_2nd_" + recNumber).val(Number(rounddown(dmg_ave_2nd,0)).toLocaleString());
    $("#dmg_max_2nd_" + recNumber).val(Number(rounddown(dmg_max_2nd,0)).toLocaleString());
    $("#dmg_min_3rd_" + recNumber).val(Number(rounddown(dmg_min_3rd,0)).toLocaleString());
    $("#dmg_ave_3rd_" + recNumber).val(Number(rounddown(dmg_ave_3rd,0)).toLocaleString());
    $("#dmg_max_3rd_" + recNumber).val(Number(rounddown(dmg_max_3rd,0)).toLocaleString());
    $("#dmg_min_ex_" + recNumber).val(Number(rounddown(dmg_min_EX,0)).toLocaleString());
    $("#dmg_ave_ex_" + recNumber).val(Number(rounddown(dmg_ave_EX,0)).toLocaleString());
    $("#dmg_max_ex_" + recNumber).val(Number(rounddown(dmg_max_EX,0)).toLocaleString());
    $("#dmg_min_total_" + recNumber).val(Number(Math.floor(dmg_min_1st) + Math.floor(dmg_min_2nd) + Math.floor(dmg_min_3rd) + Math.floor(dmg_min_EX)).toLocaleString());
    $("#dmg_ave_total_" + recNumber).val(Number(Math.floor(dmg_ave_1st) + Math.floor(dmg_ave_2nd) + Math.floor(dmg_ave_3rd) + Math.floor(dmg_ave_EX)).toLocaleString());
    $("#dmg_max_total_" + recNumber).val(Number(Math.floor(dmg_max_1st) + Math.floor(dmg_max_2nd) + Math.floor(dmg_max_3rd) + Math.floor(dmg_max_EX)).toLocaleString());

}

/**
 * 宝具ダメージ計算
 * @param atk ATK
 * @param np_dmg 宝具威力
 * @param np_kind 宝具種類
 * @param card_buff カードバフ
 * @param class_affinity クラス相性
 * @param class_servant クラス補正
 * @param attribute_affinity 属性相性
 * @param atk_buff 攻撃バフ
 * @param supereffective_buff 特攻威力バフ
 * @param np_buff 宝具バフ
 * @param supereffective_np 特攻宝具倍率
 * @param fixed_dmg 固定ダメージ
 * @param special_def 敵特殊耐性
 * @param random 乱数
 * @return 宝具ダメージ計算結果を返す
 */
function calcNpDmg(atk, np_dmg, np_kind, card_buff, class_affinity, class_servant, attribute_affinity, atk_buff,
    supereffective_buff, np_buff, supereffective_np, fixed_dmg, special_def, random) {

    var dmg;

    dmg = (atk * np_dmg / 100
        * 0.23 * card_list[np_kind] //宝具色補正
        * (100 + card_buff) / 100
        * class_affinity // クラス相性
        * class_servant // クラス補正
        * attribute_affinity // Attri相性
        * random // 乱数
        * (100 + atk_buff) / 100 //攻撃バフ
        * Math.max((100 + supereffective_buff + np_buff), 0.1) / 100
        * Math.max(0, 1.0 - Math.min(5.0, Math.max(0, 1.0 + special_def / 100) - 1.0))
        * supereffective_np / 100);

    dmg = dmg + fixed_dmg;

    return dmg;

}

/**
 * 通常攻撃ダメージ計算
 * @param atk ATK
 * @param atk_buff 攻撃バフ
 * @param card_buff カードバフ
 * @param cri_buff クリティカルバフ
 * @param bbonus カード選択順補正
 * @param bbonus_all 1stB or マイティチェインによる補正
 * @param bchain_bonus Bチェイン補正
 * @param ex_bonus EX補正値
 * @param class_affinity クラス相性
 * @param class_servant クラス補正
 * @param attribute_affinity 属性相性
 * @param cri_flag クリティカル有無
 * @param cri_valid クリティカル有効or向こう
 * @param supereffective_buff 特攻威力バフ
 * @param special_def 敵特殊耐性
 * @param fixed_dmg 固定ダメージ
 * @param random 乱数
 * @return 通常攻撃ダメージ計算結果を返す
 */
function calcDmg(atk, atk_buff, card_buff, cri_buff, bbonus, bbonus_all, bchain_bonus, ex_bonus,
    class_affinity, class_servant, attribute_affinity, cri_flag, cri_valid,
    supereffective_buff, special_def, fixed_dmg, random) {
    
    var dmg;

    dmg = (atk * 0.23 *
        (bbonus / 100 * (100 + card_buff) / 100 + bbonus_all / 100)
        * class_affinity // クラス相性
        * class_servant // クラス補正
        * attribute_affinity // Attri相性
        * random // 乱数
        * (100 + atk_buff) / 100 // 攻撃バフ
        * cri_flag // クリティカルの有無
        * ex_bonus / 100
        * Math.max((100 + supereffective_buff + cri_buff * cri_valid), 0.1) / 100
        * Math.max(0, 1.0 - Math.min(5.0, Math.max(0, 1.0 + special_def / 100) - 1.0)) // 特殊耐性
    );

    dmg = dmg + atk * bchain_bonus / 100 + fixed_dmg;

    return dmg;

}

/**
 * 切り捨て
 * @param num 数値
 * @param digit 桁
 * @return 桁で切り捨てされた数値
 */
function rounddown(num, digit) {
    var digitVal = Math.pow(10, digit);
    return (Math.floor(num * digitVal) / digitVal).toFixed(digit);
}

/**
 * 計算結果を撃破率計算にコピー
 * @param recNumber コピー対象行
 */
function copyProbInput(recNumber) {
    var card_1st, card_2nd, card_3rd, np_kind, atk, atk_b_buff, bchain_bonus;
    // Bチェインボーナス分の反映
    card_1st = $("#card_1st_" + recNumber).val();
    card_2nd = $("#card_2nd_" + recNumber).val();
    card_3rd = $("#card_3rd_" + recNumber).val();
    np_kind = $("#np_kind_" + recNumber).val();
    atk = parseFloat($("#atk_" + recNumber).val());
    atk_b_buff = parseFloat($("#b_footprints_" + recNumber).val());
    bchain_bonus = 0;

    if (card_1st == "NP") {
        if (np_kind == card_2nd && card_2nd == card_3rd && np_kind == "B") { bchain_bonus = 20; atk = atk + atk_b_buff; }
    } else if(card_2nd == "NP") {
        if (card_1st == np_kind && np_kind == card_3rd && card_1st == "B") { bchain_bonus = 20; atk = atk + atk_b_buff; }
    } else if(card_3rd == "NP") {
        if (card_1st == card_2nd && card_2nd == np_kind && card_1st == "B") { bchain_bonus = 20; atk = atk + atk_b_buff; }
    } else {
        if (card_1st == card_2nd && card_2nd == card_3rd && card_1st == "B") { bchain_bonus = 20; atk = atk + atk_b_buff; }
    };

    if ($("#card_1st_cri_" + recNumber).val() == "zero") {
        $("#dmg_1st").val("0");
        $("#fixed_1st").val("0");
    } else if (card_1st == "NP" && $("#np_dmg_" + recNumber).val() == "0") {
        $("#dmg_1st").val("0");
        $("#fixed_1st").val("0");
    } else {
        $("#dmg_1st").val(Number($("#dmg_ave_1st_" + recNumber).val().replace(/,/g, "")));
        if (card_1st != "NP") {
            $("#fixed_1st").val(parseFloat($("#fixed_dmg_" + recNumber).val()) + parseFloat($("#advanced_fixed_dmg_1st_" + recNumber).val()) + atk * bchain_bonus / 100);
        } else {
            $("#fixed_1st").val(parseFloat($("#fixed_dmg_" + recNumber).val()));
        }
    };

    if ($("#card_2nd_cri_" + recNumber).val() == "zero") {
        $("#dmg_2nd").val("0");
        $("#fixed_2nd").val("0");
    } else if (card_2nd == "NP" && $("#np_dmg_" + recNumber).val() == "0") {
        $("#dmg_2nd").val("0");
        $("#fixed_2nd").val("0");
    } else {
        $("#dmg_2nd").val(Number($("#dmg_ave_2nd_" + recNumber).val().replace(/,/g, "")));
        if (card_2nd != "NP") {
            $("#fixed_2nd").val(parseFloat($("#fixed_dmg_" + recNumber).val()) + parseFloat($("#advanced_fixed_dmg_2nd_" + recNumber).val()) + atk * bchain_bonus / 100);
        } else {
            $("#fixed_2nd").val(parseFloat($("#fixed_dmg_" + recNumber).val()));
        }
    };

    if ($("#card_3rd_cri_" + recNumber).val() == "zero") {
        $("#dmg_3rd").val("0");
        $("#fixed_3rd").val("0");
    } else if (card_3rd == "NP" && $("#np_dmg_" + recNumber).val() == "0") {
        $("#dmg_3rd").val("0");
        $("#fixed_3rd").val("0");
    } else {
        $("#dmg_3rd").val(Number($("#dmg_ave_3rd_" + recNumber).val().replace(/,/g, "")));
        if (card_3rd != "NP") {
            $("#fixed_3rd").val(parseFloat($("#fixed_dmg_" + recNumber).val()) + parseFloat($("#advanced_fixed_dmg_3rd_" + recNumber).val()) + atk * bchain_bonus / 100);
        } else {
            $("#fixed_3rd").val(parseFloat($("#fixed_dmg_" + recNumber).val()));
        }
    };
    
    if ($("#ex_cri_" + recNumber).val() == "zero") {
        $("#dmg_Ex").val("0");
        $("#fixed_Ex").val("0");
    } else {
        $("#dmg_Ex").val($("#dmg_ave_ex_" + recNumber).val().replace(/,/g, ""));
        $("#fixed_Ex").val(parseFloat($("#fixed_dmg_" + recNumber).val()) + parseFloat($("#advanced_fixed_dmg_Ex_" + recNumber).val()));
    };

    $("#dmg_total").val(parseFloat($("#dmg_1st").val()) + parseFloat($("#dmg_2nd").val()) + parseFloat($("#dmg_3rd").val()) + parseFloat($("#dmg_Ex").val()));
    $("#fixed_total").val(parseFloat($("#fixed_1st").val()) + parseFloat($("#fixed_2nd").val()) + parseFloat($("#fixed_3rd").val()) + parseFloat($("#fixed_Ex").val()));

}

/**
 * 撃破率計算
 */
function calcProb() {
    var dmg_1st, dmg_2nd, dmg_3rd, dmg_Ex, buff_1st, buff_2nd, buff_3rd, buff_Ex;

    dmg_1st = parseFloat($("#dmg_1st").val());
    dmg_2nd = parseFloat($("#dmg_2nd").val());
    dmg_3rd = parseFloat($("#dmg_3rd").val());
    dmg_Ex = parseFloat($("#dmg_Ex").val());
    $("#dmg_total").val(Number(parseFloat($("#dmg_1st").val()) + parseFloat($("#dmg_2nd").val()) + parseFloat($("#dmg_3rd").val()) + parseFloat($("#dmg_Ex").val())).toLocaleString());
 
    buff_1st = parseFloat($("#fixed_1st").val());
    buff_2nd = parseFloat($("#fixed_2nd").val());
    buff_3rd = parseFloat($("#fixed_3rd").val());
    buff_Ex = parseFloat($("#fixed_Ex").val());
    $("#fixed_total").val(Number(parseFloat($("#fixed_1st").val()) + parseFloat($("#fixed_2nd").val()) + parseFloat($("#fixed_3rd").val()) + parseFloat($("#fixed_Ex").val())).toLocaleString());

    var rand = new Array(200);
    for (let cnt = 0; cnt < 200; cnt++) {
        rand[cnt] = 0.9 + 0.001 * cnt;
    }

    var first = new Array(40000);
    var second = new Array(40000);
    for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
            first[200 * x + y] = calc_damage(dmg_1st, buff_1st, 0, 0, 0, 0, 0, 0, rand[x]) + calc_damage(0, 0, dmg_2nd, buff_2nd, 0, 0, 0, 0, rand[y]);
            second[200 * x + y] = calc_damage(0, 0, 0, 0, dmg_3rd, buff_3rd, 0, 0, rand[x]) + calc_damage(0, 0, 0, 0, 0, 0, dmg_Ex, buff_Ex, rand[y]);
        }
    }
    first.sort((a, b) => a - b);
    second.sort((a, b) => a - b);

    var enemy_hp = parseFloat($("#enemy_hp").val());
    var ret = 0;
    for (let x = 0; x < 40000; x++) {
        ret += 40000 - binarySearch(second, enemy_hp - first[x]);
    }
    ret = ret / (40000 * 4);

    $("#prob_result").val(Math.floor(ret) / 100 + "%")

};

/**
 * ダメージ乱数計算
 */
function calc_damage(l1, s1, l2, s2, l3, s3, l4, s4, rand) {
    return Math.floor((l1 - s1) * rand + s1) + Math.floor((l2 - s2) * rand + s2) + Math.floor((l3 - s3) * rand + s3) + Math.floor((l4 - s4) * rand + s4);
};

/**
 * 2分探索
 * @param arr ソート済みの探索対象配列
 * @param target 探索する値
 * @return 探索結果の添字 見つからなかった場合は-1を返す
 */
function binarySearch(arr, target) {

    let min = -1;
    let max = arr.length;

    while (max - min > 1) {

        let mid = Math.floor((min + max) / 2);

        if (arr[mid] < target) {
            min = mid;
        } else {
            max = mid;
        }
    }

    return max;

};

/**
 * パラメーターをNPスター計算にコピー
 * @param recNumber コピー対象行
 */
function copyNpStarInput(recNumber) {

    $("#np_kind_np_star").val($("#np_kind_" + recNumber).val());
    $("#b_card_buff_np_star").val($("#b_card_buff_" + recNumber).val());
    $("#a_card_buff_np_star").val($("#a_card_buff_" + recNumber).val());
    $("#q_card_buff_np_star").val($("#q_card_buff_" + recNumber).val());
    $("#b_card_debuff_np_star").val($("#b_card_debuff_" + recNumber).val());
    $("#a_card_debuff_np_star").val($("#a_card_debuff_" + recNumber).val());
    $("#q_card_debuff_np_star").val($("#q_card_debuff_" + recNumber).val());
    $("#ex_atk_buff_np_star").val($("#ex_atk_buff_" + recNumber).val());
    $("#card_1st_np_star").val($("#card_1st_" + recNumber).val());
    $("#card_2nd_np_star").val($("#card_2nd_" + recNumber).val());
    $("#card_3rd_np_star").val($("#card_3rd_" + recNumber).val());
    $("#card_1st_cri_np_star").val($("#card_1st_cri_" + recNumber).val());
    $("#card_2nd_cri_np_star").val($("#card_2nd_cri_" + recNumber).val());
    $("#card_3rd_cri_np_star").val($("#card_3rd_cri_" + recNumber).val());
    $("#card_Ex_cri_np_star").val($("#ex_cri_" + recNumber).val());
        
}

/**
 * NPスター獲得量計算メイン処理
 */
function calcRate() {
    var card_1st, card_2nd, card_3rd, na, q_hit, a_hit, b_hit, ex_hit, qBonus_1st, aBonus_1st, q_card_buff, a_card_buff, b_card_buff, ex_card_buff, np_card, np_hit,
        qBonus_all, aBonus_all, qBonus_2nd, aBonus_2nd, qBonus_3rd, aBonus_3rd,buff_1st, buff_2nd, buff_3rd, na_buff, hit_1st, hit_2nd, hit_3rd,
        card_1st_np, card_2nd_np, card_3rd_np, sr, sr_buff, np_enemy, sr_enemy, q_card_debuff, a_card_debuff, b_card_debuff,
        ok_1st, ok_2nd, ok_3rd, ok_ex, card_1st_np_cri, card_2nd_np_cri, card_3rd_np_cri, card_1st_star_cri, card_2nd_star_cri, card_3rd_star_cri,
        result_1st_np, result_2nd_np, result_3rd_np, result_ex_np, result_1st_np_ovk, result_2nd_np_ovk, result_3rd_np_ovk, result_ex_np_ovk,
        result_1st_star, result_2nd_star, result_3rd_star, result_ex_star, result_1st_star_ovk, result_2nd_star_ovk, result_3rd_star_ovk, result_ex_star_ovk;

    na = parseFloat($("#NA").val());
    card_1st = $("#card_1st_np_star").val();
    card_2nd = $("#card_2nd_np_star").val();
    card_3rd = $("#card_3rd_np_star").val();
    if ($("#card_1st_cri_np_star").val() == "Y") {
        card_1st_np_cri = 2;
        card_1st_star_cri = 20;
    }
    else {
        card_1st_np_cri = 1;
        card_1st_star_cri = 0;
    };
    if ($("#card_2nd_cri_np_star").val() == "Y") {
        card_2nd_np_cri = 2;
        card_2nd_star_cri = 20;
    }
    else {
        card_2nd_np_cri = 1;
        card_2nd_star_cri = 0;
    };
    if ($("#card_3rd_cri_np_star").val() == "Y") {
        card_3rd_np_cri = 2;
        card_3rd_star_cri = 20;
    }
    else {
        card_3rd_np_cri = 1;
        card_3rd_star_cri = 0;
    };
    qBonus_all = 0;
    aBonus_all = 0;
    b_hit = parseFloat($("#b_hit").val());
    a_hit = parseFloat($("#a_hit").val());
    q_hit = parseFloat($("#q_hit").val());
    ex_hit = parseFloat($("#ex_hit").val());
    np_hit = parseFloat($("#np_hit").val());
    b_card_buff = parseFloat($("#b_card_buff_np_star").val());
    a_card_buff = parseFloat($("#a_card_buff_np_star").val());
    q_card_buff = parseFloat($("#q_card_buff_np_star").val());
    b_card_debuff = parseFloat($("#b_card_debuff_np_star").val());
    a_card_debuff = parseFloat($("#a_card_debuff_np_star").val());
    q_card_debuff = parseFloat($("#q_card_debuff_np_star").val());
    ex_card_buff = parseFloat($("#ex_atk_buff_np_star").val());
    na_buff = parseFloat($("#NA_buff").val());
    np_card = $("#np_kind_np_star").val();
    sr = parseFloat($("#SR").val());
    sr_buff = parseFloat($("#SR_buff").val());
    np_enemy = parseFloat($("#NA_enemy")[0][$("#NA_enemy")[0].selectedIndex].dataset.na_enemy);
    sr_enemy = parseFloat($("#SR_enemy")[0][$("#SR_enemy")[0].selectedIndex].dataset.sr_enemy);
    card_1st_np = 1;
    card_2nd_np = 1;
    card_3rd_np = 1;
    ok_ex = ex_hit;

    if (q_card_buff > 400) { q_card_buff = 400 };
    if (a_card_buff > 400) { a_card_buff = 400 };
    if (b_card_buff > 400) { b_card_buff = 400 };
    if (ex_card_buff > 400) { ex_card_buff = 400 };
    if (na_buff > 400) { na_buff = 400 };
    if (sr_buff > 500) { sr_buff = 500 };

    if (card_1st == "NP") { card_1st = np_card; card_1st_np = 0; card_1st_np_cri = 1; card_1st_star_cri = 0; };
    if (card_2nd == "NP") { card_2nd = np_card; card_2nd_np = 0; card_2nd_np_cri = 1; card_2nd_star_cri = 0; };
    if (card_3rd == "NP") { card_3rd = np_card; card_3rd_np = 0; card_3rd_np_cri = 1; card_3rd_star_cri = 0; };

    if ((card_1st != card_2nd && card_2nd != card_3rd && card_3rd != card_1st) || card_1st == "Q") { qBonus_all = 20; }
    if ((card_1st != card_2nd && card_2nd != card_3rd && card_3rd != card_1st) || card_1st == "A") { aBonus_all = 100; }

    if (card_1st == "B") { qBonus_1st = 10; aBonus_1st = 0; buff_1st = b_card_buff + b_card_debuff; hit_1st = b_hit; ok_1st = b_hit; };
    if (card_1st == "A") { qBonus_1st = 0; aBonus_1st = 300; buff_1st = a_card_buff + a_card_debuff; hit_1st = a_hit; ok_1st = a_hit; };
    if (card_1st == "Q") { qBonus_1st = 80; aBonus_1st = 100; buff_1st = q_card_buff + q_card_debuff; hit_1st = q_hit; ok_1st = q_hit; };

    if (card_2nd == "B") { qBonus_2nd = 15; aBonus_2nd = 0; buff_2nd = b_card_buff + b_card_debuff; hit_2nd = b_hit; ok_2nd = b_hit; };
    if (card_2nd == "A") { qBonus_2nd = 0; aBonus_2nd = 450; buff_2nd = a_card_buff + a_card_debuff; hit_2nd = a_hit; ok_2nd = a_hit; };
    if (card_2nd == "Q") { qBonus_2nd = 130; aBonus_2nd = 150; buff_2nd = q_card_buff + q_card_debuff; hit_2nd = q_hit; ok_2nd = q_hit; };

    if (card_3rd == "B") { qBonus_3rd = 20; aBonus_3rd = 0; buff_3rd = b_card_buff + b_card_debuff; hit_3rd = b_hit; ok_3rd = b_hit; };
    if (card_3rd == "A") { qBonus_3rd = 0; aBonus_3rd = 600; buff_3rd = a_card_buff + a_card_debuff; hit_3rd = a_hit; ok_3rd = a_hit; };
    if (card_3rd == "Q") { qBonus_3rd = 180; aBonus_3rd = 200; buff_3rd = q_card_buff + q_card_debuff; hit_3rd = q_hit; ok_3rd = q_hit; };

    if (card_1st_np == 0 && card_1st == "B") { qBonus_1st = 10; aBonus_1st = 0; };
    if (card_1st_np == 0 && card_1st == "A") { qBonus_1st = 0; aBonus_1st = 300; };
    if (card_1st_np == 0 && card_1st == "Q") { qBonus_1st = 80; aBonus_1st = 100; };

    if (card_2nd_np == 0 && card_2nd == "B") { qBonus_2nd = 10; aBonus_2nd = 0; };
    if (card_2nd_np == 0 && card_2nd == "A") { qBonus_2nd = 0; aBonus_2nd = 300; };
    if (card_2nd_np == 0 && card_2nd == "Q") { qBonus_2nd = 80; aBonus_2nd = 100; };

    if (card_3rd_np == 0 && card_3rd == "B") { qBonus_3rd = 10; aBonus_3rd = 0; };
    if (card_3rd_np == 0 && card_3rd == "A") { qBonus_3rd = 0; aBonus_3rd = 300; };
    if (card_3rd_np == 0 && card_3rd == "Q") { qBonus_3rd = 80; aBonus_3rd = 100; };

    if (card_1st_np == 0) { hit_1st = np_hit; ok_1st = np_hit; };
    if (card_2nd_np == 0) { hit_2nd = np_hit; ok_2nd = np_hit; };
    if (card_3rd_np == 0) { hit_3rd = np_hit; ok_3rd = np_hit; };

    if ($("#card_1st_cri_np_star").val() == "zero") { hit_1st = 0; ok_1st = 0; };
    if ($("#card_2nd_cri_np_star").val() == "zero") { hit_2nd = 0; ok_2nd = 0; };
    if ($("#card_3rd_cri_np_star").val() == "zero") { hit_3rd = 0; ok_3rd = 0; };
    if ($("#card_Ex_cri_np_star").val() == "zero") { ex_hit = 0; ok_ex = 0; };

    result_1st_np = calcNp(hit_1st, na, aBonus_1st, buff_1st, aBonus_all, card_1st_np, np_enemy, na_buff, card_1st_np_cri, 0);
    result_2nd_np = calcNp(hit_2nd, na, aBonus_2nd, buff_2nd, aBonus_all, card_2nd_np, np_enemy, na_buff, card_2nd_np_cri, 0);
    result_3rd_np = calcNp(hit_3rd, na, aBonus_3rd, buff_3rd, aBonus_all, card_3rd_np, np_enemy, na_buff, card_3rd_np_cri, 0);
    result_ex_np = calcNp(ex_hit, na, 100, ex_card_buff, aBonus_all, 1, np_enemy, na_buff, 1, 0, 0);

    result_1st_star = calcStar(hit_1st, sr + sr_enemy, qBonus_1st, buff_1st, qBonus_all, card_1st_np, sr_buff, card_1st_star_cri, 0);
    result_2nd_star = calcStar(hit_2nd, sr + sr_enemy, qBonus_2nd, buff_2nd, qBonus_all, card_2nd_np, sr_buff, card_2nd_star_cri, 0);
    result_3rd_star = calcStar(hit_3rd, sr + sr_enemy, qBonus_3rd, buff_3rd, qBonus_all, card_3rd_np, sr_buff, card_3rd_star_cri, 0);
    result_ex_star = calcStar(ex_hit, sr + sr_enemy, 100, ex_card_buff, qBonus_all, 1, sr_buff, 0, 0);

    result_1st_np_ovk = calcNp(hit_1st, na, aBonus_1st, buff_1st, aBonus_all, card_1st_np, np_enemy, na_buff, card_1st_np_cri, ok_1st);
    result_2nd_np_ovk = calcNp(hit_2nd, na, aBonus_2nd, buff_2nd, aBonus_all, card_2nd_np, np_enemy, na_buff, card_2nd_np_cri, ok_2nd);
    result_3rd_np_ovk = calcNp(hit_3rd, na, aBonus_3rd, buff_3rd, aBonus_all, card_3rd_np, np_enemy, na_buff, card_3rd_np_cri, ok_3rd);
    result_ex_np_ovk = calcNp(ex_hit, na, 100, ex_card_buff, aBonus_all, 1, np_enemy, na_buff, 1, ok_ex, 0);

    result_1st_star_ovk = calcStar(hit_1st, sr + sr_enemy, qBonus_1st, buff_1st, qBonus_all, card_1st_np, sr_buff, card_1st_star_cri, ok_1st);
    result_2nd_star_ovk = calcStar(hit_2nd, sr + sr_enemy, qBonus_2nd, buff_2nd, qBonus_all, card_2nd_np, sr_buff, card_2nd_star_cri, ok_2nd);
    result_3rd_star_ovk = calcStar(hit_3rd, sr + sr_enemy, qBonus_3rd, buff_3rd, qBonus_all, card_3rd_np, sr_buff, card_3rd_star_cri, ok_3rd);
    result_ex_star_ovk = calcStar(ex_hit, sr + sr_enemy, 100, ex_card_buff, qBonus_all, 1, sr_buff, 0, ok_ex);

    $("#np_result_1st_np").val(result_1st_np + "%");
    $("#np_result_2nd_np").val(result_2nd_np + "%");
    $("#np_result_3rd_np").val(result_3rd_np + "%");
    $("#np_result_EX_np").val(result_ex_np + "%");
    $("#np_result_total_np").val(BigNumber(result_1st_np).plus(result_2nd_np).plus(result_3rd_np).plus(result_ex_np) + "%");

    $("#np_result_1st_star")[0].innerText = result_1st_star[0] + "(+" + result_1st_star[5] + ")個" + "\n" + result_1st_star[1] + result_1st_star[2] + "\n" + result_1st_star[3] + result_1st_star[4];
    $("#np_result_2nd_star")[0].innerText = result_2nd_star[0] + "(+" + result_2nd_star[5] + ")個" + "\n" + result_2nd_star[1] + result_2nd_star[2] + "\n" + result_2nd_star[3] + result_2nd_star[4];
    $("#np_result_3rd_star")[0].innerText = result_3rd_star[0] + "(+" + result_3rd_star[5] + ")個" + "\n" + result_3rd_star[1] + result_3rd_star[2] + "\n" + result_3rd_star[3] + result_3rd_star[4];
    $("#np_result_EX_star")[0].innerText = result_ex_star[0] + "(+" + result_ex_star[5] + ")個" + "\n" + result_ex_star[1] + result_ex_star[2] + "\n" + result_ex_star[3] + result_ex_star[4];
    $("#np_result_total_star").val((result_1st_star[0] + result_2nd_star[0] + result_3rd_star[0] + result_ex_star[0]) + "(+" + (result_1st_star[5] + result_2nd_star[5] + result_3rd_star[5] + result_ex_star[5]) + ")個");

    $("#np_result_1st_np_ovk").val(result_1st_np_ovk + "%");
    $("#np_result_2nd_np_ovk").val(result_2nd_np_ovk + "%");
    $("#np_result_3rd_np_ovk").val(result_3rd_np_ovk + "%");
    $("#np_result_EX_np_ovk").val(result_ex_np_ovk + "%");
    $("#np_result_total_np_ovk").val(BigNumber(result_1st_np_ovk).plus(result_2nd_np_ovk).plus(result_3rd_np_ovk).plus(result_ex_np_ovk) + "%");

    $("#np_result_1st_star_ovk")[0].innerText = result_1st_star_ovk[0] + "(+" + result_1st_star_ovk[5] + ")個" + "\n" + result_1st_star_ovk[1] + result_1st_star_ovk[2] + "\n" + result_1st_star_ovk[3] + result_1st_star_ovk[4];
    $("#np_result_2nd_star_ovk")[0].innerText = result_2nd_star_ovk[0] + "(+" + result_2nd_star_ovk[5] + ")個" + "\n" + result_2nd_star_ovk[1] + result_2nd_star_ovk[2] + "\n" + result_2nd_star_ovk[3] + result_2nd_star_ovk[4];
    $("#np_result_3rd_star_ovk")[0].innerText = result_3rd_star_ovk[0] + "(+" + result_3rd_star_ovk[5] + ")個" + "\n" + result_3rd_star_ovk[1] + result_3rd_star_ovk[2] + "\n" + result_3rd_star_ovk[3] + result_3rd_star_ovk[4];
    $("#np_result_EX_star_ovk")[0].innerText = result_ex_star_ovk[0] + "(+" + result_ex_star_ovk[5] + ")個" + "\n" + result_ex_star_ovk[1] + result_ex_star_ovk[2] + "\n" + result_ex_star_ovk[3] + result_ex_star_ovk[4];
    $("#np_result_total_star_ovk").val((result_1st_star_ovk[0] + result_2nd_star_ovk[0] + result_3rd_star_ovk[0] + result_ex_star_ovk[0]) + "(+" + (result_1st_star_ovk[5] + result_2nd_star_ovk[5] + result_3rd_star_ovk[5] + result_ex_star_ovk[5]) + ")個");

};

/**
 * NP獲得量計算
 * @param hit ヒット数
 * @param na N/A
 * @param aBonus Aボーナス
 * @param card_buff カードバフ
 * @param aBonus_all 全体Aボーナス
 * @param card_NP NPカード
 * @param enemy_rate 敵補正
 * @param na_buff N/Aバフ
 * @param cri クリティカル
 * @param ok オーバーキル
 */
function calcNp(hit, na, aBonus, card_buff, aBonus_all, card_NP, enemy_rate, na_buff, cri, ok) {
    var np;

    np = 100 * (na * (aBonus / 100 * (100 + card_buff) / 100 + aBonus_all * card_NP / 100) * enemy_rate / 100 * (100 + na_buff) / 100) * cri;
    np = Math.floor(np);
    np = (np * (hit - ok) + Math.floor(1.5 * np) * ok) / 100;

    return np;
};

/**
 * スター獲得量計算
 * @param hit ヒット数
 * @param sr SR
 * @param qBonus qボーナス
 * @param card_buff カードバフ
 * @param qBonus_all 全体Qボーナス
 * @param card_NP NPカード
 * @param sr_buff SRバフ
 * @param cri クリティカル
 * @param ok オーバーキル
 */
function calcStar(hit, sr, qBonus, card_buff, qBonus_all, card_NP, sr_buff, cri, ok) {
    var star, star_num, star_ok, star_ok_num;
    var result = [];
    var star_tmp = 0;
    
    star = 100 * (sr / 100 + qBonus / 100 * (100 + card_buff) / 100 + qBonus_all * card_NP / 100 + sr_buff / 100 + cri / 100);
    star_ok = 100 * (sr / 100 + qBonus / 100 * (100 + card_buff) / 100 + qBonus_all * card_NP / 100 + sr_buff / 100 + cri / 100 + 30 / 100);
    star = Math.floor(star * 100);
    star = Math.floor(star / 10.0);
    if (star > 3000) { star = 3000 };
    star_num = Math.floor(star / 1000);
    star_ok = Math.floor(star_ok * 100);
    star_ok = Math.floor(star_ok / 10.0);
    if (star_ok > 3000) { star_ok = 3000 };
    star_ok_num = Math.floor(star_ok / 1000);
    star_num = Math.max(star_num, 0);
    star_ok_num = Math.max(star_ok_num, 0);
    result.push(star_num * hit);
    if (rounddown(Math.max((star - 1000 * star_num) / 10.0, 0.0), 1) > 0) {
        star_tmp += parseFloat(hit - ok);
    }
    if (rounddown(Math.max((star_ok - 1000 * star_num) / 10.0, 0.0), 1) > 0) {
        star_tmp += parseFloat(ok);
    }
    result.push(rounddown(Math.max((star - 1000 * star_num) / 10.0, 0.0), 1) + "%*");
    result.push(parseFloat(hit - ok));
    result.push(rounddown(Math.max((star_ok - 1000 * star_num) / 10.0, 0.0), 1) + "%*");
    result.push(parseFloat(ok));
    result.push(star_tmp);

    return result;
};

/**
 * スリップダメージ計算メイン処理
 */
function calcSlip() {
    var poison, poison_buff, burn, burn_buff, curse, curse_buff, other_slip, poison_result, burn_result, curse_result, result;
    
    poison_result = 0;
    burn_result = 0;
    curse_result = 0;
    poison = parseFloat($("#poison").val());
    poison_buff = parseFloat($("#poison_buff").val());
    burn = parseFloat($("#burn").val());
    burn_buff = parseFloat($("#burn_buff").val());
    curse = parseFloat($("#curse").val());
    curse_buff = parseFloat($("#curse_buff").val());
    other_slip = parseFloat($("#other_slip").val());

    poison_result = poison * poison_buff / 100 + poison;
    burn_result = burn * burn_buff / 100 + burn;
    curse_result = curse * curse_buff / 100 + curse;
    result = Number(rounddown(poison_result,0)) + Number(rounddown(burn_result,0)) + Number(rounddown(curse_result,0)) + Number(rounddown(other_slip,0));
    
    $("#slip_result").val(result.toLocaleString());
 
};