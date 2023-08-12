const card_list = { "B": 1.5, "A": 1.0, "Q": 0.8 }; //宝具色補正
const defaultRow = 15; // 初期行数
var rowNumber = 0; // 現在行数
var selDamageTotal = 0;
var selDamageNum = 0;

$(function(){
    /**
     * フォーカスイベント
     */
    $(document).on("focus", "input", function () {
        
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
     * ↑入れ替え
     */
    $(document).on("click", ".up_change_link", function() {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];
        var recNext = Number(recNumber) - 1;

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

        // 行コピー実行
        copyParam(recNumber, recNext);

        // コピー先を再計算
        calcMain(recNext);

        return false;

    });

    /**
     * クリアボタンイベント
     */
    $(document).on("click", ".clear", function() {

        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

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

    //開くボタンをクリックしたらモーダルを表示する
    $(document).on("click", ".prob_link", function() {

        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

        // 行の目標ダメージを復元
        $("#enemy_hp").val($("#prob_hp_" + recNumber).val());

        // パラメーターを撃破率画面にコピー
        copyProbInput(recNumber);

        // 撃破率計算
        calcProb();

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

});

/**
 * パラメーター初期化
 * @param row 行番号
 */
function clearParam(row) {

    $("#atk_" + row).val("0");
    $("#np_dmg_" + row).val("450");
    $("#np_kind_" + row).val("A");
    $("#atk_buff_" + row).val("0");
    $("#def_debuff_" + row).val("0");
    $("#b_card_buff_" + row).val("0");
    $("#b_card_debuff_" + row).val("0");
    $("#b_card_cri_buff_" + row).val("0");
    $("#a_card_buff_" + row).val("0");
    $("#a_card_debuff_" + row).val("0");
    $("#a_card_cri_buff_" + row).val("0");
    $("#q_card_buff_" + row).val("0");
    $("#q_card_debuff_" + row).val("0");
    $("#q_card_cri_buff_" + row).val("0");
    $("#cri_buff_" + row).val("0");
    $("#np_buff_" + row).val("0");
    $("#supereffective_buff_" + row).val("0");
    $("#supereffective_np_" + row).val("100");
    $("#fixed_dmg_" + row).val("0");
    $("#special_def_" + row).val("0");
    $("#class_affinity_" + row).val("1.0");
    $("#attribute_affinity_" + row).val("1.0");
    $("#class_servant_" + row).val("1.00");
    $("#card_1st_" + row).val("A");
    $("#card_1st_cri_" + row).val("N");
    $("#card_2nd_" + row).val("A");
    $("#card_2nd_cri_" + row).val("N");
    $("#card_3rd_" + row).val("A");
    $("#card_3rd_cri_" + row).val("N");
    $("#dmg_min_1st_" + row).val("0");
    $("#dmg_ave_1st_" + row).val("0");
    $("#dmg_max_1st_" + row).val("0");
    $("#dmg_min_2nd_" + row).val("0");
    $("#dmg_ave_2nd_" + row).val("0");
    $("#dmg_max_2nd_" + row).val("0");
    $("#dmg_min_3rd_" + row).val("0");
    $("#dmg_ave_3rd_" + row).val("0");
    $("#dmg_max_3rd_" + row).val("0");
    $("#dmg_min_total_" + row).val("0");
    $("#dmg_ave_total_" + row).val("0");
    $("#dmg_max_total_" + row).val("0");

    $("#prob_hp_" + row).val("0");
    $("#enemy_hp").val("0");
    $("#prob_recNumber").val("");

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
    $("#atk_" + recNext).val($("#atk_" + recNumber).val());
    $("#np_dmg_" + recNext).val($("#np_dmg_" + recNumber).val());
    $("#np_kind_" + recNext).val($("#np_kind_" + recNumber).val());
    $("#atk_buff_" + recNext).val($("#atk_buff_" + recNumber).val());
    $("#def_debuff_" + recNext).val($("#def_debuff_" + recNumber).val());
    $("#b_card_buff_" + recNext).val($("#b_card_buff_" + recNumber).val());
    $("#b_card_debuff_" + recNext).val($("#b_card_debuff_" + recNumber).val());
    $("#b_card_cri_buff_" + recNext).val($("#b_card_cri_buff_" + recNumber).val());
    $("#a_card_buff_" + recNext).val($("#a_card_buff_" + recNumber).val());
    $("#a_card_debuff_" + recNext).val($("#a_card_debuff_" + recNumber).val());
    $("#a_card_cri_buff_" + recNext).val($("#a_card_cri_buff_" + recNumber).val());
    $("#q_card_buff_" + recNext).val($("#q_card_buff_" + recNumber).val());
    $("#q_card_debuff_" + recNext).val($("#q_card_debuff_" + recNumber).val());
    $("#q_card_cri_buff_" + recNext).val($("#q_card_cri_buff_" + recNumber).val());
    $("#cri_buff_" + recNext).val($("#cri_buff_" + recNumber).val());
    $("#np_buff_" + recNext).val($("#np_buff_" + recNumber).val());
    $("#supereffective_buff_" + recNext).val($("#supereffective_buff_" + recNumber).val());
    $("#supereffective_np_" + recNext).val($("#supereffective_np_" + recNumber).val());
    $("#fixed_dmg_" + recNext).val($("#fixed_dmg_" + recNumber).val());
    $("#special_def_" + recNext).val($("#special_def_" + recNumber).val());
    $("#class_affinity_" + recNext).val($("#class_affinity_" + recNumber).val());
    $("#attribute_affinity_" + recNext).val($("#attribute_affinity_" + recNumber).val());
    $("#class_servant_" + recNext).val($("#class_servant_" + recNumber).val());
    $("#card_1st_" + recNext).val($("#card_1st_" + recNumber).val());
    $("#card_1st_cri_" + recNext).val($("#card_1st_cri_" + recNumber).val());
    $("#card_2nd_" + recNext).val($("#card_2nd_" + recNumber).val());
    $("#card_2nd_cri_" + recNext).val($("#card_2nd_cri_" + recNumber).val());
    $("#card_3rd_" + recNext).val($("#card_3rd_" + recNumber).val());
    $("#card_3rd_cri_" + recNext).val($("#card_3rd_cri_" + recNumber).val());

    $("#prob_hp_" + recNext).val($("#prob_hp_" + recNumber).val());

}

/**
 * 行入れ替え
 * @param recNumber 入れ替え元行
 * @param recNext 入れ替え先行
 */
function changeParam(recNumber, recNext){
    var atk,np_dmg,np_kind,atk_buff,def_debuff, b_card_buff,b_card_cri_buff,a_card_buff,a_card_cri_buff,q_card_buff,q_card_cri_buff,cri_buff,
    b_card_debuff, a_card_debuff, q_card_debuff,np_buff,supereffective_buff,supereffective_np,fixed_dmg,special_def,
    class_affinity,attribute_affinity,class_servant,card_1st,card_1st_cri,card_2nd,card_2nd_cri,card_3rd,card_3rd_cri,prob_hp;

    atk = $("#atk_" + recNext).val();
    np_dmg = $("#np_dmg_" + recNext).val();
    np_kind = $("#np_kind_" + recNext).val();
    atk_buff = $("#atk_buff_" + recNext).val();
    def_debuff = $("#def_debuff_" + recNext).val();
    b_card_buff = $("#b_card_buff_" + recNext).val();
    b_card_debuff = $("#b_card_debuff_" + recNext).val();
    b_card_cri_buff = $("#b_card_cri_buff_" + recNext).val();
    a_card_buff = $("#a_card_buff_" + recNext).val();
    a_card_debuff = $("#a_card_debuff_" + recNext).val();
    a_card_cri_buff = $("#a_card_cri_buff_" + recNext).val();
    q_card_buff = $("#q_card_buff_" + recNext).val();
    q_card_debuff = $("#q_card_debuff_" + recNext).val();
    q_card_cri_buff = $("#q_card_cri_buff_" + recNext).val();
    cri_buff = $("#cri_buff_" + recNext).val();
    np_buff = $("#np_buff_" + recNext).val();
    supereffective_buff = $("#supereffective_buff_" + recNext).val();
    supereffective_np = $("#supereffective_np_" + recNext).val();
    fixed_dmg = $("#fixed_dmg_" + recNext).val();
    special_def = $("#special_def_" + recNext).val();
    class_affinity = $("#class_affinity_" + recNext).val();
    attribute_affinity = $("#attribute_affinity_" + recNext).val();
    class_servant = $("#class_servant_" + recNext).val();
    card_1st = $("#card_1st_" + recNext).val();
    card_1st_cri = $("#card_1st_cri_" + recNext).val();
    card_2nd = $("#card_2nd_" + recNext).val();
    card_2nd_cri = $("#card_2nd_cri_" + recNext).val();
    card_3rd = $("#card_3rd_" + recNext).val();
    card_3rd_cri = $("#card_3rd_cri_" + recNext).val();

    prob_hp = $("#prob_hp_" + recNext).val();

    // コピー
    copyParam(recNumber, recNext);
    
    $("#atk_" + recNumber).val(atk);
    $("#np_dmg_" + recNumber).val(np_dmg);
    $("#np_kind_" + recNumber).val(np_kind);
    $("#atk_buff_" + recNumber).val(atk_buff);
    $("#def_debuff_" + recNumber).val(def_debuff);
    $("#b_card_buff_" + recNumber).val(b_card_buff);
    $("#b_card_debuff_" + recNumber).val(b_card_debuff);
    $("#b_card_cri_buff_" + recNumber).val(b_card_cri_buff);
    $("#a_card_buff_" + recNumber).val(a_card_buff);
    $("#a_card_debuff_" + recNumber).val(a_card_debuff);
    $("#a_card_cri_buff_" + recNumber).val(a_card_cri_buff);
    $("#q_card_buff_" + recNumber).val(q_card_buff);
    $("#q_card_debuff_" + recNumber).val(q_card_debuff);
    $("#q_card_cri_buff_" + recNumber).val(q_card_cri_buff);
    $("#cri_buff_" + recNumber).val(cri_buff);
    $("#np_buff_" + recNumber).val(np_buff);
    $("#supereffective_buff_" + recNumber).val(supereffective_buff);
    $("#supereffective_np_" + recNumber).val(supereffective_np);
    $("#fixed_dmg_" + recNumber).val(fixed_dmg);
    $("#special_def_" + recNumber).val(special_def);
    $("#class_affinity_" + recNumber).val(class_affinity);
    $("#attribute_affinity_" + recNumber).val(attribute_affinity);
    $("#class_servant_" + recNumber).val(class_servant);
    $("#card_1st_" + recNumber).val(card_1st);
    $("#card_1st_cri_" + recNumber).val(card_1st_cri);
    $("#card_2nd_" + recNumber).val(card_2nd);
    $("#card_2nd_cri_" + recNumber).val(card_2nd_cri);
    $("#card_3rd_" + recNumber).val(card_3rd);
    $("#card_3rd_cri_" + recNumber).val(card_3rd_cri);
    
    $("#prob_hp_" + recNumber).val(prob_hp);
        
}

/**
 * 計算メイン処理
 * @param recNumber 計算対象行
 */
function calcMain(recNumber) {
    var atk, np_dmg, np_kind, atk_buff, def_debuff, b_card_buff, b_card_debuff, a_card_buff, a_card_debuff, q_card_buff, q_card_debuff,
    cri_buff, b_card_cri_buff, a_card_cri_buff, q_card_cri_buff, np_buff, supereffective_buff, supereffective_np, fixed_dmg,
    special_def,class_affinity, attribute_affinity, class_servant, card_1st, card_1st_cri, card_2nd, card_2nd_cri, card_3rd, card_3rd_cri,
    bbonus_1st, bbonus_2nd, bbonus_3rd, bbonus_all, bchain_bonus, atk_1st, atk_2nd, atk_3rd, card_buff_1st, card_buff_2nd, card_buff_3rd,
    supereffective_buff_1st, supereffective_buff_2nd, supereffective_buff_3rd,
    fixed_dmg_1st, fixed_dmg_2nd, fixed_dmg_3rd, special_def_1st, special_def_2nd, special_def_3rd,
    atk_buff_1st, atk_buff_2nd, atk_buff_3rd, 
    cri_buff_1st, cri_buff_2nd, cri_buff_3rd, np_card_buff,
    dmg_ave_1st, dmg_ave_2nd, dmg_ave_3rd,
    dmg_max_1st, dmg_max_2nd, dmg_max_3rd,
    dmg_min_1st, dmg_min_2nd, dmg_min_3rd,
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
    cri_buff = parseFloat($("#cri_buff_" + recNumber).val());
    np_buff = parseFloat($("#np_buff_" + recNumber).val());
    supereffective_buff = parseFloat($("#supereffective_buff_" + recNumber).val());
    supereffective_np = parseFloat($("#supereffective_np_" + recNumber).val());
    fixed_dmg = parseFloat($("#fixed_dmg_" + recNumber).val());
    special_def = parseFloat($("#special_def_" + recNumber).val());
    class_affinity = parseFloat($("#class_affinity_" + recNumber).val());
    attribute_affinity = parseFloat($("#attribute_affinity_" + recNumber).val());
    class_servant = parseFloat($("#class_servant_" + recNumber).val());
    card_1st = $("#card_1st_" + recNumber).val();
    card_1st_cri = $("#card_1st_cri_" + recNumber).val();
    card_2nd = $("#card_2nd_" + recNumber).val();
    card_2nd_cri = $("#card_2nd_cri_" + recNumber).val();
    card_3rd = $("#card_3rd_" + recNumber).val();
    card_3rd_cri = $("#card_3rd_cri_" + recNumber).val();

    bbonus_all = 0; bchain_bonus = 0;

    if (atk_buff > 400) {atk_buff = 400; };
    if (atk_buff < -100) {atk_buff = -100; };
    if (def_debuff > 100) {def_debuff = 100; };
    if (b_card_buff > 400) {b_card_buff = 400; };
    if (b_card_buff < -100) {b_card_buff = -100; };
    if (a_card_buff > 400) {a_card_buff = 400; };
    if (a_card_buff < -100) {a_card_buff = -100; };
    if (q_card_buff > 400) {q_card_buff = 400; };
    if (q_card_buff < -100) {q_card_buff = -100; };
    if (supereffective_buff > 1000) {supereffective_buff = 1000; };
    if (np_buff > 500) {np_buff = 500; };
    if (np_buff < -100) {np_buff = -100; };

    // カード選択ボーナスを設定
    // 1st
    if (card_1st == "Q") {
        bbonus_1st = 80;
        card_buff_1st = q_card_buff + q_card_debuff;
        if (cri_buff + q_card_cri_buff > 500){
            cri_buff_1st = 500;
        }
        else {
            cri_buff_1st = cri_buff + q_card_cri_buff;
        }
    }
    if (card_1st == "A") {
        bbonus_1st = 100;
        card_buff_1st = a_card_buff + a_card_debuff;
        if (cri_buff + a_card_cri_buff > 500){
            cri_buff_1st = 500;
        }
        else {
            cri_buff_1st = cri_buff + a_card_cri_buff;
        }
    }
    if (card_1st == "B") {
        bbonus_1st = 150;
        card_buff_1st = b_card_buff + b_card_debuff;
        if (cri_buff + b_card_cri_buff > 500){
            cri_buff_1st = 500;
        }
        else {
            cri_buff_1st = cri_buff + b_card_cri_buff;
        }
    }
    if (card_1st == "NP" && np_kind == "Q") {
        np_card_buff = q_card_buff + q_card_debuff;
        bbonus_1st = 80;
        card_buff_1st = q_card_buff + q_card_debuff;
    }
    if (card_1st == "NP" && np_kind == "A") {
        np_card_buff = a_card_buff + a_card_debuff;
        bbonus_1st = 100;
        card_buff_1st = a_card_buff + a_card_debuff;
    }
    if (card_1st == "NP" && np_kind == "B") {
        np_card_buff = b_card_buff + b_card_debuff;
        bbonus_1st = 150;
        card_buff_1st = b_card_buff + b_card_debuff;
    }
    // 2nd
    if (card_2nd == "Q") {
        bbonus_2nd = 80;
        card_buff_2nd = q_card_buff + q_card_debuff;
        if (cri_buff + q_card_cri_buff > 500){
            cri_buff_2nd = 500;
        }
        else {
            cri_buff_2nd = cri_buff + q_card_cri_buff;
        }
    }
    if (card_2nd == "A") {
        bbonus_2nd = 100;
        card_buff_2nd = a_card_buff + a_card_debuff;
        if (cri_buff + a_card_cri_buff > 500){
            cri_buff_2nd = 500;
        }
        else {
            cri_buff_2nd = cri_buff + a_card_cri_buff;
        }
    }
    if (card_2nd == "B") {
        bbonus_2nd = 150;
        card_buff_2nd = b_card_buff + b_card_debuff;
        if (cri_buff + b_card_cri_buff > 500){
            cri_buff_2nd = 500;
        }
        else {
            cri_buff_2nd = cri_buff + b_card_cri_buff;
        }
    }
    if (card_2nd == "NP" && np_kind == "Q") {
        np_card_buff = q_card_buff + q_card_debuff;
        bbonus_2nd = 80;
        card_buff_2nd = q_card_buff + q_card_debuff;
    }
    if (card_2nd == "NP" && np_kind == "A") {
        np_card_buff = a_card_buff + a_card_debuff;
        bbonus_2nd = 100;
        card_buff_2nd = a_card_buff + a_card_debuff;
    }
    if (card_2nd == "NP" && np_kind == "B") {
        np_card_buff = b_card_buff + b_card_debuff;
        bbonus_2nd = 150;
        card_buff_2nd = b_card_buff + b_card_debuff;
    }
    // 3rd
    if (card_3rd == "Q") {
        bbonus_3rd = 80;
        card_buff_3rd = q_card_buff + q_card_debuff;
        if (cri_buff + q_card_cri_buff > 500){
            cri_buff_3rd = 500;
        }
        else {
            cri_buff_3rd = cri_buff + q_card_cri_buff;
        }
    }
    if (card_3rd == "A") {
        bbonus_3rd = 100;
        card_buff_3rd = a_card_buff + a_card_debuff;
        if (cri_buff + a_card_cri_buff > 500){
            cri_buff_3rd = 500;
        }
        else {
            cri_buff_3rd = cri_buff + a_card_cri_buff;
        }
    }
    if (card_3rd == "B") {
        bbonus_3rd = 150;
        card_buff_3rd = b_card_buff + b_card_debuff;
        if (cri_buff + b_card_cri_buff > 500){
            cri_buff_3rd = 500;
        }
        else {
            cri_buff_3rd = cri_buff + b_card_cri_buff;
        }
    }
    if (card_3rd == "NP" && np_kind == "Q") {
        np_card_buff = q_card_buff + q_card_debuff;
        bbonus_3rd = 80;
        card_buff_3rd = q_card_buff + q_card_debuff;
    }
    if (card_3rd == "NP" && np_kind == "A") {
        np_card_buff = a_card_buff + a_card_debuff;
        bbonus_3rd = 100;
        card_buff_3rd = a_card_buff + a_card_debuff;
    }
    if (card_3rd == "NP" && np_kind == "B") {
        np_card_buff = b_card_buff + b_card_debuff;
        bbonus_3rd = 150;
        card_buff_3rd = b_card_buff + b_card_debuff;
    }
    // 1st共通
    atk_1st = atk;
    atk_buff_1st = atk_buff + def_debuff;
    supereffective_buff_1st = supereffective_buff;
    fixed_dmg_1st = fixed_dmg;
    special_def_1st = special_def;
    // 2nd共通
    atk_2nd = atk;
    atk_buff_2nd = atk_buff + def_debuff;
    supereffective_buff_2nd = supereffective_buff;
    fixed_dmg_2nd = fixed_dmg;
    special_def_2nd = special_def;
    // 3rd共通
    atk_3rd = atk;
    atk_buff_3rd = atk_buff + def_debuff;
    supereffective_buff_3rd = supereffective_buff;
    fixed_dmg_3rd = fixed_dmg;
    special_def_3rd = special_def;

    // 1st計算
    if (card_1st == "NP") {
        dmg_ave_1st = calcNpDmg(atk, np_dmg, np_kind, np_card_buff, class_affinity, class_servant, attribute_affinity, atk_buff_1st,
            supereffective_buff_1st, np_buff, supereffective_np, fixed_dmg_1st, special_def_1st, 1);
        dmg_min_1st = calcNpDmg(atk, np_dmg, np_kind, np_card_buff, class_affinity, class_servant, attribute_affinity, atk_buff_1st,
            supereffective_buff_1st, np_buff, supereffective_np, fixed_dmg_1st, special_def_1st, 0.9);
        dmg_max_1st = calcNpDmg(atk, np_dmg, np_kind, np_card_buff, class_affinity, class_servant, attribute_affinity, atk_buff_1st,
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
        dmg_ave_2nd = calcNpDmg(atk, np_dmg, np_kind, np_card_buff, class_affinity, class_servant, attribute_affinity, atk_buff_2nd,
            supereffective_buff_2nd, np_buff, supereffective_np, fixed_dmg_2nd, special_def_2nd, 1);
        dmg_min_2nd = calcNpDmg(atk, np_dmg, np_kind, np_card_buff, class_affinity, class_servant, attribute_affinity, atk_buff_2nd,
            supereffective_buff_2nd, np_buff, supereffective_np, fixed_dmg_2nd, special_def_2nd, 0.9);
        dmg_max_2nd = calcNpDmg(atk, np_dmg, np_kind, np_card_buff, class_affinity, class_servant, attribute_affinity, atk_buff_2nd,
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
        dmg_ave_3rd = calcNpDmg(atk, np_dmg, np_kind, np_card_buff, class_affinity, class_servant, attribute_affinity, atk_buff_3rd,
            supereffective_buff_3rd, np_buff, supereffective_np, fixed_dmg_3rd, special_def_3rd, 1);
        dmg_min_3rd = calcNpDmg(atk, np_dmg, np_kind, np_card_buff, class_affinity, class_servant, attribute_affinity, atk_buff_3rd,
            supereffective_buff_3rd, np_buff, supereffective_np, fixed_dmg_3rd, special_def_3rd, 0.9);
        dmg_max_3rd = calcNpDmg(atk, np_dmg, np_kind, np_card_buff, class_affinity, class_servant, attribute_affinity, atk_buff_3rd,
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
   
    // 1stダメージ有無・クリティカル有無を設定
    if (card_1st != "NP" && card_1st_cri == "Y") {
        dmg_ave_1st = dmg_cri_ave_1st;
        dmg_min_1st = dmg_cri_min_1st;
        dmg_max_1st = dmg_cri_max_1st;
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
    } else if (card_3rd_cri == "zero") {
        dmg_ave_3rd = 0;
        dmg_min_3rd = 0;
        dmg_max_3rd = 0;
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
    $("#dmg_min_total_" + recNumber).val(Number(Math.floor(dmg_min_1st) + Math.floor(dmg_min_2nd) + Math.floor(dmg_min_3rd)).toLocaleString());
    $("#dmg_ave_total_" + recNumber).val(Number(Math.floor(dmg_ave_1st) + Math.floor(dmg_ave_2nd) + Math.floor(dmg_ave_3rd)).toLocaleString());
    $("#dmg_max_total_" + recNumber).val(Number(Math.floor(dmg_max_1st) + Math.floor(dmg_max_2nd) + Math.floor(dmg_max_3rd)).toLocaleString());

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
    var card_1st, card_2nd, card_3rd, atk, bchain_bonus;
    // Bチェインボーナス分の反映
    card_1st = $("#card_1st_" + recNumber).val();
    card_2nd = $("#card_2nd_" + recNumber).val();
    card_3rd = $("#card_3rd_" + recNumber).val();
    atk = parseFloat($("#atk_" + recNumber).val());
    bchain_bonus = 0;

    if ($("#card_1st_cri_" + recNumber).val() == "zero") {
        $("#dmg_1st").val("0");
        $("#fixed_1st").val("0");
    } else {
        $("#dmg_1st").val(Number($("#dmg_ave_1st_" + recNumber).val().replace(/,/g, "")));
        if (card_1st != "NP") {
            $("#fixed_1st").val(parseFloat($("#fixed_dmg_" + recNumber).val()) + atk * bchain_bonus / 100);
        } else {
            $("#fixed_1st").val(parseFloat($("#fixed_dmg_" + recNumber).val()));
        }
    };

    if ($("#card_2nd_cri_" + recNumber).val() == "zero") {
        $("#dmg_2nd").val("0");
        $("#fixed_2nd").val("0");
    } else {
        $("#dmg_2nd").val(Number($("#dmg_ave_2nd_" + recNumber).val().replace(/,/g, "")));
        if (card_2nd != "NP") {
            $("#fixed_2nd").val(parseFloat($("#fixed_dmg_" + recNumber).val()) + atk * bchain_bonus / 100);
        } else {
            $("#fixed_2nd").val(parseFloat($("#fixed_dmg_" + recNumber).val()));
        }
    };

    if ($("#card_3rd_cri_" + recNumber).val() == "zero") {
        $("#dmg_3rd").val("0");
        $("#fixed_3rd").val("0");
    } else {
        $("#dmg_3rd").val(Number($("#dmg_ave_3rd_" + recNumber).val().replace(/,/g, "")));
        if (card_3rd != "NP") {
            $("#fixed_3rd").val(parseFloat($("#fixed_dmg_" + recNumber).val()) + atk * bchain_bonus / 100);
        } else {
            $("#fixed_3rd").val(parseFloat($("#fixed_dmg_" + recNumber).val()));
        }
    };

    $("#dmg_total").val(parseFloat($("#dmg_1st").val()) + parseFloat($("#dmg_2nd").val()) + parseFloat($("#dmg_3rd").val()));
    $("#fixed_total").val(parseFloat($("#fixed_1st").val()) + parseFloat($("#fixed_2nd").val()) + parseFloat($("#fixed_3rd").val()));

}

/**
 * 撃破率計算
 */
function calcProb() {
    var dmg_1st, dmg_2nd, dmg_3rd, buff_1st, buff_2nd, buff_3rd;

    dmg_1st = parseFloat($("#dmg_1st").val());
    dmg_2nd = parseFloat($("#dmg_2nd").val());
    dmg_3rd = parseFloat($("#dmg_3rd").val());
    $("#dmg_total").val(Number(parseFloat($("#dmg_1st").val()) + parseFloat($("#dmg_2nd").val()) + parseFloat($("#dmg_3rd").val())).toLocaleString());
 
    buff_1st = parseFloat($("#fixed_1st").val());
    buff_2nd = parseFloat($("#fixed_2nd").val());
    buff_3rd = parseFloat($("#fixed_3rd").val());
    $("#fixed_total").val(Number(parseFloat($("#fixed_1st").val()) + parseFloat($("#fixed_2nd").val()) + parseFloat($("#fixed_3rd").val())).toLocaleString());

    var rand = new Array(200);
    for (let cnt = 0; cnt < 200; cnt++) {
        rand[cnt] = 0.9 + 0.001 * cnt;
    }

    var first = new Array(40000);
    var second = new Array(40000);
    for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
            first[200 * x + y] = calc_damage(dmg_1st, buff_1st, 0, 0, 0, 0, 0, 0, rand[x]) + calc_damage(0, 0, dmg_2nd, buff_2nd, 0, 0, 0, 0, rand[y]);
            second[200 * x + y] = calc_damage(0, 0, 0, 0, dmg_3rd, buff_3rd, 0, 0, rand[x]) + calc_damage(0, 0, 0, 0, 0, 0, 0, 0, rand[y]);
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
