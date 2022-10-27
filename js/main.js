const card_list = { "B": 1.5, "A": 1.0, "Q": 0.8 }; //宝具色補正
const defaultRow = 8; // 初期行数
var rowNumber = 0; // 現在行数

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

        // 対象行を計算
        calcMain(recNumber);
    });

    /**
     * セレクトボックス変更イベント
     */
    $(document).on("change", "select", function () {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

        // 対象行を計算
        calcMain(recNumber);

    });

    /**
     * コピー
     */
    $(document).on("click", ".copy_link", function() {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];
        var recNext = Number(recNumber) + 1;

        // コピー元が最終行の場合1行追加
        if ((Number(recNumber) + 1) == (defaultRow + rowNumber)){
            var row = defaultRow + rowNumber;
        
            // 行追加
            addRow(row);
    
            rowNumber++;
            recNext = row;

            var element = document.documentElement;
            var bottom = element.scrollHeight - element.clientHeight;
            // ページ最下部に移動
            window.scroll(0, bottom);
        };

        // 行コピー実行
        copyParam(recNumber, recNext);

        // コピー先を再計算
        calcMain(recNext);

        return false;

    });

    /**
     * 詳細設定ボタン押下イベント
     */
    $(document).on("click", ".advanced_link", function() {

        if ($(".col_advanced_setting").css("display") == "none"){
            $(".col_advanced_setting").css({"display":"table-cell"});
            $(".calc").css({"width":"1547"});
        }
        else {
            $(".col_advanced_setting").css({"display":"none"});
            $(".calc").css({"width":"1354"});
        }
        
        return false;

    });

    /**
     * 行追加ボタンイベント
     */
    $(document).on("click", "#addRow", function() {

        var row = defaultRow + rowNumber;
        
        // 行を追加
        addRow(row);

        rowNumber++;

        var element = document.documentElement;
        var bottom = element.scrollHeight - element.clientHeight;
        // ページ最下部に移動
        window.scroll(0, bottom);

    });

    /**
     * クリアボタンイベント
     */
    $(document).on("click", "#clear", function() {

        var row = defaultRow + rowNumber;

        for (let cnt = 0; cnt < row; cnt++){
            // 行のパラメーターを初期化
            clearParam(cnt);
        }

        // クリアボタンの場合は目標ダメージも初期化
        $("#enemy_hp").val("0");

    });

    /**
     * 画面表示後
     */
    $(document).ready(function(){

        /*
        // 設定数分行作成
        for (let cnt = 1; cnt < defaultRow; cnt++){
            // 行追加
            addRow(cnt);
        }
        */

    });

    //開くボタンをクリックしたらモーダルを表示する
    $(document).on("click", ".prob_link", function() {

        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

        // パラメーターを撃破率画面にコピー
        copyProbInput(recNumber);

        // 撃破率計算
        calcProb();

        $(".modal-container").addClass("active");

        return false;

    });

    /**
     * ×でモーダルを閉じるイベント
     */
    $(".modal-close").on("click",function(){  
        $(".modal-container").removeClass("active");
    });

    /**
     * 画面外クリックでモーダルを閉じるイベント
     */
    $(document).on("click",function(e) {
        if(!$(e.target).closest(".modal-body").length) {
            $(".modal-container").removeClass("active");
        }
    });

    /**
     * 撃破率フォーカス遷移イベント
     */
    $("#probTable").on("blur", "input", function () {

        if (this.value == "") {this.value = "0";};

        // 撃破率計算
        calcProb();

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
                    case "b_card_cri_buff_" :
                        nextIdStr = "b_card_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "b_card_buff_" :
                        nextIdStr = "b_card_cri_buff_";
                        recNumber--;
                        break;
                    case "a_card_cri_buff_" :
                        nextIdStr = "a_card_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "a_card_buff_" :
                        nextIdStr = "a_card_cri_buff_";
                        recNumber--;
                        break;
                    case "q_card_cri_buff_" :
                        nextIdStr = "q_card_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "q_card_buff_" :
                        nextIdStr = "q_card_cri_buff_";
                        recNumber--;
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
                    case "b_card_cri_buff_" :
                        nextIdStr = "b_card_buff_";
                        recNumber++;
                        break;
                    case "b_card_buff_" :
                        nextIdStr = "b_card_cri_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "a_card_cri_buff_" :
                        nextIdStr = "a_card_buff_";
                        recNumber++;
                        break;
                    case "a_card_buff_" :
                        nextIdStr = "a_card_cri_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "q_card_cri_buff_" :
                        nextIdStr = "q_card_buff_";
                        recNumber++;
                        break;
                    case "q_card_buff_" :
                        nextIdStr = "q_card_cri_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
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
 * 行追加
 * @param row 行番号
 */
function addRow(row){

    var rowHtml = '<tr><td class="col_copy"><a href="#" id="copy_' + row + '" class="copy_link"><img src="img/arrow.png"></a></td><td class="col_atk"><input type="number" id="atk_' + row + '" value="0" max="99999" min="0" step="500" class="atk"></td><td class="col_np"><input type="number" id="np_dmg_' + row + '" value="500" max="3000" min="0" step="50" class="np_dmg"><div class="boundary_line"></div><select id="np_kind_' + row + '" class="np_kind"><option value="B" selected>B</option><option value="A">A</option><option value="Q">Q</option></select></td><td class="col_atk_buff"><input type="number" id="atk_buff_' + row + '" value="0" max="400" min="-100" step="10" class="atk_buff"></td><td class="col_card_buff"><input type="number" id="b_card_buff_' + row + '" value="0" max="400" min="-100" step="10" class="b_card_buff"><div class="boundary_line"></div><input type="number" id="b_card_cri_buff_' + row + '" value="0" max="500" min="-100" step="10" class="b_card_cri_buff"></td><td class="col_card_buff"><input type="number" id="a_card_buff_' + row + '" value="0" max="400" min="-100" step="10" class="a_card_buff"><div class="boundary_line"></div><input type="number" id="a_card_cri_buff_' + row + '" value="0" max="500" min="-100" step="10" class="a_card_cri_buff"></td><td class="col_card_buff"><input type="number" id="q_card_buff_' + row + '" value="0" max="400" min="-100" step="10" class="q_card_buff"><div class="boundary_line"></div><input type="number" id="q_card_cri_buff_' + row + '" value="0" max="500" min="-100" step="10" class="q_card_cri_buff"></td><td class="col_cri_buff"><input type="number" id="cri_buff_' + row + '" value="0" max="500" min="0" step="1" class="cri_buff"></td><td class="col_np_buff"><input type="number" id="np_buff_' + row + '" value="0" max="500" min="-100" step="10" class="np_buff"></td><td class="col_ex_atk_buff"><input type="number" id="ex_atk_buff_' + row + '" value="0" max="50" min="0" step="1" class="ex_atk_buff"></td><td class="col_supereffective_buff"><input type="number" id="supereffective_buff_' + row + '" value="0" max="1000" min="0" step="10" class="supereffective_buff"></td><td class="col_supereffective_np"><input type="number" id="supereffective_np_' + row + '" value="100" max="500" min="0" step="50" class="supereffective_np"></td><td class="col_fixed_dmg"><input type="number" id="fixed_dmg_' + row + '" value="0" step="10" class="fixed_dmg"></td><td class="col_footprints"><input type="number" id="b_footprints_' + row + '" value="0" max="500" min="0" step="20" class="b_footprints"><div class="boundary_line"></div><input type="number" id="a_footprints_' + row + '" value="0" max="500" min="0" step="20" class="a_footprints"><div class="boundary_line"></div><input type="number" id="q_footprints_' + row + '" value="0" max="500" min="0" step="20" class="q_footprints"></td><td class="col_special_def"><input type="number" id="special_def_' + row + '" value="0" max="100" min="-100" step="10" class="special_def"></td><td class="col_advanced"><a href="#" class="advanced_link"><img src="img/setting.png"></a></td><td class="col_advanced_setting"><input type="number" id="advanced_atk_buff_1st_' + row + '" value="0" max="400" step="10" class="advanced_atk_buff_1st"><div class="boundary_line"></div><input type="number" id="advanced_atk_buff_2nd_' + row + '" value="0" max="400" step="10" class="advanced_atk_buff_2nd"><div class="boundary_line"></div><input type="number" id="advanced_atk_buff_3rd_' + row + '" value="0" max="400" step="10" class="advanced_atk_buff_3rd"><div class="boundary_line"></div><input type="number" id="advanced_atk_buff_Ex_' + row + '" value="0" max="400" step="10" class="advanced_atk_buff_Ex"></td><td class="col_advanced_setting"><input type="number" id="advanced_card_buff_1st_' + row + '" value="0" max="400" step="10" class="advanced_card_buff_1st"><div class="boundary_line"></div><input type="number" id="advanced_card_buff_2nd_' + row + '" value="0" max="400" step="10" class="advanced_card_buff_2nd"><div class="boundary_line"></div><input type="number" id="advanced_card_buff_3rd_' + row + '" value="0" max="400" step="10" class="advanced_card_buff_3rd"><div class="boundary_line"></div><div class="advanced_blank"></div></td><td class="col_advanced_setting"><input type="number" id="advanced_cri_buff_1st_' + row + '" value="0" max="500" step="10" class="advanced_cri_buff_1st"><div class="boundary_line"></div><input type="number" id="advanced_cri_buff_2nd_' + row + '" value="0" max="500" step="10" class="advanced_cri_buff_2nd"><div class="boundary_line"></div><input type="number" id="advanced_cri_buff_3rd_' + row + '" value="0" max="500" step="10" class="advanced_cri_buff_3rd"><div class="boundary_line"></div><div class="advanced_blank"></div></td><td class="col_advanced_setting"><input type="number" id="advanced_supereffective_buff_1st_' + row + '" value="0" max="1000" step="10" class="advanced_supereffective_buff_1st"><div class="boundary_line"></div><input type="number" id="advanced_supereffective_buff_2nd_' + row + '" value="0" max="1000" step="10" class="advanced_supereffective_buff_2nd"><div class="boundary_line"></div><input type="number" id="advanced_supereffective_buff_3rd_' + row + '" value="0" max="1000" step="10" class="advanced_supereffective_buff_3rd"><div class="boundary_line"></div><input type="number" id="advanced_supereffective_buff_Ex_' + row + '" value="0" max="1000" step="10" class="advanced_supereffective_buff_Ex"></td><td class="col_advanced_setting col_fixed_dmg"><input type="number" id="advanced_fixed_dmg_1st_' + row + '" value="0" step="10" class="advanced_fixed_dmg_1st"><div class="boundary_line"></div><input type="number" id="advanced_fixed_dmg_2nd_' + row + '" value="0" step="10" class="advanced_fixed_dmg_2nd"><div class="boundary_line"></div><input type="number" id="advanced_fixed_dmg_3rd_' + row + '" value="0" step="10" class="advanced_fixed_dmg_3rd"><div class="boundary_line"></div><input type="number" id="advanced_fixed_dmg_Ex_' + row + '" value="0" step="10" class="advanced_fixed_dmg_Ex"></td><td class="col_advanced_setting"><input type="number" id="advanced_special_def_1st_' + row + '" value="0" max="100" step="10" class="advanced_special_def_1st"><div class="boundary_line"></div><input type="number" id="advanced_special_def_2nd_' + row + '" value="0" max="100" step="10" class="advanced_special_def_2nd"><div class="boundary_line"></div><input type="number" id="advanced_special_def_3rd_' + row + '" value="0" max="100" step="10" class="advanced_special_def_3rd"><div class="boundary_line"></div><input type="number" id="advanced_special_def_Ex_' + row + '" value="0" max="100" step="10" class="advanced_special_def_Ex"></td><td class="col_class_affinity"><select id="class_affinity_' + row + '" class="class_affinity"><option value="0.5">0.5</option><option value="1.0">1.0</option><option value="1.2">1.2</option><option value="1.5">1.5</option><option value="2.0" selected>2.0</option></select></td><td class="col_class_servant"><select id="class_servant_' + row + '" class="class_servant"><option value="0.90">0.9</option><option value="0.95">0.95</option><option value="1.00" selected>1.0</option><option value="1.05">1.05</option><option value="1.10">1.1</option></select></td><td class="col_attribute_affinity"><select id="attribute_affinity_' + row + '" class="attribute_affinity"><option value="0.9">0.9</option><option value="1.0" selected>1.0</option><option value="1.1">1.1</option></select></td><td class="col_card_sel"><select id="card_1st_' + row + '" class="card_1st"><option value="NP" selected>N</option><option value="B">B</option><option value="A">A</option><option value="Q">Q</option></select><div class="boundary_line"></div><select id="card_1st_cri_' + row + '" class="card_1st_cri"><option value="Y">有</option><option value="N">無</option><option value="zero">0</option></select></td><td class="col_card_sel"><select id="card_2nd_' + row + '" class="card_2nd"><option value="NP">N</option><option value="B" selected>B</option><option value="A">A</option><option value="Q">Q</option></select><div class="boundary_line"></div><select id="card_2nd_cri_' + row + '" class="card_2nd_cri"><option value="Y">有</option><option value="N">無</option><option value="zero">0</option></select></td><td  class="col_card_sel"><select id="card_3rd_' + row + '" class="card_3rd"><option value="NP">N</option><option value="B" selected>B</option><option value="A">A</option><option value="Q">Q</option></select><div class="boundary_line"></div><select id="card_3rd_cri_' + row + '" class="card_3rd_cri"><option value="Y">有</option><option value="N">無</option><option value="zero">0</option></select></td><td  class="col_card_sel"><select id="ex_cri_' + row + '" class="ex_cri"><option value="N">有</option><option value="zero">0</option></select></td><td class="col_dmg_result"><div class="wrap_dmg_result"><output type="number" id="dmg_min_1st_' + row + '" class="dmg_result">0</output></div><div class="wrap_dmg_result"><output type="number" id="dmg_ave_1st_' + row + '" class="dmg_result">0</output></div><div class="wrap_dmg_result"><output type="number" id="dmg_max_1st_' + row + '" class="dmg_result">0</output></div></td><td class="col_dmg_result"><div class="wrap_dmg_result"><output type="number" id="dmg_min_2nd_' + row + '" class="dmg_result">0</output></div><div class="wrap_dmg_result"><output type="number" id="dmg_ave_2nd_' + row + '" class="dmg_result">0</output></div><div class="wrap_dmg_result"><output type="number" id="dmg_max_2nd_' + row + '" class="dmg_result">0</output></div></td><td class="col_dmg_result"><div class="wrap_dmg_result"><output type="number" id="dmg_min_3rd_' + row + '" class="dmg_result">0</output></div><div class="wrap_dmg_result"><output type="number" id="dmg_ave_3rd_' + row + '" class="dmg_result">0</output></div><div class="wrap_dmg_result"><output type="number" id="dmg_max_3rd_' + row + '" class="dmg_result">0</output></div></td><td class="col_dmg_result"><div class="wrap_dmg_result"><output type="number" id="dmg_min_ex_' + row + '" class="dmg_result">0</output></div><div class="wrap_dmg_result"><output type="number" id="dmg_ave_ex_' + row + '" class="dmg_result">0</output></div><div class="wrap_dmg_result"><output type="number" id="dmg_max_ex_' + row + '" class="dmg_result">0</output></div></td><td class="col_dmg_result"><div class="wrap_dmg_result"><output type="number" id="dmg_min_total_' + row + '" class="dmg_result">0</output></div><div class="wrap_dmg_result"><output type="number" id="dmg_ave_total_' + row + '" class="dmg_result">0</output></div><div class="wrap_dmg_result"><output type="number" id="dmg_max_total_' + row + '" class="dmg_result">0</output></div></td><td class="col_prob"><a href="#" id="prob_' + row + '" class="prob_link"><img src="img/calculator.png"></a></td></tr>';

    $("#calcItem").append(rowHtml);

    if ($(".col_advanced_setting").css("display") == "none"){
        $(".col_advanced_setting").css({"display":"none"});
    }
    else {
        $(".col_advanced_setting").css({"display":"table-cell"});
    }

}

/**
 * パラメーター初期化
 * @param row 行番号
 */
function clearParam(row) {

    $("#atk_" + row).val("0");
    $("#np_dmg_" + row).val("500");
    $("#np_kind_" + row).val("B");
    $("#atk_buff_" + row).val("0");
    $("#b_card_buff_" + row).val("0");
    $("#b_card_cri_buff_" + row).val("0");
    $("#a_card_buff_" + row).val("0");
    $("#a_card_cri_buff_" + row).val("0");
    $("#q_card_buff_" + row).val("0");
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
    $("#advanced_card_buff_1st_" + row).val("0");
    $("#advanced_card_buff_2nd_" + row).val("0");
    $("#advanced_card_buff_3rd_" + row).val("0");
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
    $("#ex_cri_" + row).val("N");
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
    $("#b_card_buff_" + recNext).val($("#b_card_buff_" + recNumber).val());
    $("#b_card_cri_buff_" + recNext).val($("#b_card_cri_buff_" + recNumber).val());
    $("#a_card_buff_" + recNext).val($("#a_card_buff_" + recNumber).val());
    $("#a_card_cri_buff_" + recNext).val($("#a_card_cri_buff_" + recNumber).val());
    $("#q_card_buff_" + recNext).val($("#q_card_buff_" + recNumber).val());
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
    $("#advanced_card_buff_1st_" + recNext).val($("#advanced_card_buff_1st_" + recNumber).val());
    $("#advanced_card_buff_2nd_" + recNext).val($("#advanced_card_buff_2nd_" + recNumber).val());
    $("#advanced_card_buff_3rd_" + recNext).val($("#advanced_card_buff_3rd_" + recNumber).val());
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
}

/**
 * 計算メイン処理
 * @param recNumber 計算対象行
 */
function calcMain(recNumber) {
    var atk, np_dmg, np_kind, atk_buff, b_card_buff, b_card_cri_buff, a_card_buff, a_card_cri_buff, q_card_buff, q_card_cri_buff,
    cri_buff, np_buff, ex_atk_buff, supereffective_buff, supereffective_np, fixed_dmg, b_footprints, a_footprints, q_footprints,
    special_def, advanced_atk_buff_1st, advanced_atk_buff_2nd, advanced_atk_buff_3rd, advanced_atk_buff_ex,
    advanced_supereffective_buff_1st, advanced_supereffective_buff_2nd, advanced_supereffective_buff_3rd, advanced_supereffective_buff_ex,
    advanced_fixed_dmg_1st, advanced_fixed_dmg_2nd, advanced_fixed_dmg_3rd, advanced_fixed_dmg_ex, 
    advanced_special_def_1st, advanced_special_def_2nd, advanced_special_def_3rd, advanced_special_def_ex,
    advanced_card_buff_1st, advanced_card_buff_2nd, advanced_card_buff_3rd,
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
    b_card_buff = parseFloat($("#b_card_buff_" + recNumber).val());
    b_card_cri_buff = parseFloat($("#b_card_cri_buff_" + recNumber).val());
    a_card_buff = parseFloat($("#a_card_buff_" + recNumber).val());
    a_card_cri_buff = parseFloat($("#a_card_cri_buff_" + recNumber).val());
    q_card_buff = parseFloat($("#q_card_buff_" + recNumber).val());
    q_card_cri_buff = parseFloat($("#q_card_cri_buff_" + recNumber).val());
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
    advanced_card_buff_1st = parseFloat($("#advanced_card_buff_1st_" + recNumber).val());
    advanced_card_buff_2nd = parseFloat($("#advanced_card_buff_2nd_" + recNumber).val());
    advanced_card_buff_3rd = parseFloat($("#advanced_card_buff_3rd_" + recNumber).val());
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

    // カード選択ボーナスを設定
    // 1st
    if (card_1st == "Q") {
        bbonus_1st = 80;
        card_buff_1st = q_card_buff + advanced_card_buff_1st;
        cri_buff_1st = cri_buff + q_card_cri_buff + advanced_cri_buff_1st;
        atk_1st = atk + q_footprints;
    }
    if (card_1st == "A") {
        bbonus_1st = 100;
        card_buff_1st = a_card_buff + advanced_card_buff_1st;
        cri_buff_1st = cri_buff + a_card_cri_buff + advanced_cri_buff_1st;
        atk_1st = atk + a_footprints;
    }
    if (card_1st == "B") {
        bbonus_all = 50;
        bbonus_1st = 150;
        card_buff_1st = b_card_buff + advanced_card_buff_1st;
        cri_buff_1st = cri_buff + b_card_cri_buff + advanced_cri_buff_1st;
        atk_1st = atk + b_footprints;
    }
    if (card_1st == "NP" && np_kind == "Q") {
        np_card_buff = q_card_buff + advanced_card_buff_1st;
        bbonus_1st = 80;
        card_buff_1st = q_card_buff + advanced_card_buff_1st;
        cri_buff_1st = cri_buff + q_card_cri_buff + advanced_cri_buff_1st;
    }
    if (card_1st == "NP" && np_kind == "A") {
        np_card_buff = a_card_buff + advanced_card_buff_1st;
        bbonus_1st = 100;
        card_buff_1st = a_card_buff + advanced_card_buff_1st;
        cri_buff_1st = cri_buff + a_card_cri_buff + advanced_cri_buff_1st;
    }
    if (card_1st == "NP" && np_kind == "B") {
        np_card_buff = b_card_buff + advanced_card_buff_1st;
        bbonus_all = 50;
        bbonus_1st = 150;
        card_buff_1st = b_card_buff + advanced_card_buff_1st;
        cri_buff_1st = cri_buff + b_card_cri_buff + advanced_cri_buff_1st;
    }
    // 2nd
    if (card_2nd == "Q") {
        bbonus_2nd = 96;
        card_buff_2nd = q_card_buff + advanced_card_buff_2nd;
        cri_buff_2nd = cri_buff + q_card_cri_buff + advanced_cri_buff_2nd;
        atk_2nd = atk + q_footprints;
    }
    if (card_2nd == "A") {
        bbonus_2nd = 120;
        card_buff_2nd = a_card_buff + advanced_card_buff_2nd;
        cri_buff_2nd = cri_buff + a_card_cri_buff + advanced_cri_buff_2nd;
        atk_2nd = atk + a_footprints;
    }
    if (card_2nd == "B") {
        bbonus_2nd = 180;
        card_buff_2nd = b_card_buff + advanced_card_buff_2nd;
        cri_buff_2nd = cri_buff + b_card_cri_buff + advanced_cri_buff_2nd;
        atk_2nd = atk + b_footprints;
    }
    if (card_2nd == "NP" && np_kind == "Q") {
        np_card_buff = q_card_buff + advanced_card_buff_2nd;
        bbonus_2nd = 96;
        card_buff_2nd = q_card_buff + advanced_card_buff_2nd;
        cri_buff_2nd = cri_buff + q_card_cri_buff + advanced_cri_buff_2nd;
    }
    if (card_2nd == "NP" && np_kind == "A") {
        np_card_buff = a_card_buff + advanced_card_buff_2nd;
        bbonus_2nd = 120;
        card_buff_2nd = a_card_buff + advanced_card_buff_2nd;
        cri_buff_2nd = cri_buff + a_card_cri_buff + advanced_cri_buff_2nd;
    }
    if (card_2nd == "NP" && np_kind == "B") {
        np_card_buff = b_card_buff + advanced_card_buff_2nd;
        bbonus_2nd = 180;
        card_buff_2nd = b_card_buff + advanced_card_buff_2nd;
        cri_buff_2nd = cri_buff + b_card_cri_buff + advanced_cri_buff_2nd;
    }
    // 3rd
    if (card_3rd == "Q") {
        bbonus_3rd = 112;
        card_buff_3rd = q_card_buff + advanced_card_buff_3rd;
        cri_buff_3rd = cri_buff + q_card_cri_buff + advanced_cri_buff_3rd;
        atk_3rd = atk + q_footprints;
    }
    if (card_3rd == "A") {
        bbonus_3rd = 140;
        card_buff_3rd = a_card_buff + advanced_card_buff_3rd;
        cri_buff_3rd = cri_buff + a_card_cri_buff + advanced_cri_buff_3rd;
        atk_3rd = atk + a_footprints;
    }
    if (card_3rd == "B") {
        bbonus_3rd = 210;
        card_buff_3rd = b_card_buff + advanced_card_buff_3rd;
        cri_buff_3rd = cri_buff + b_card_cri_buff + advanced_cri_buff_3rd;
        atk_3rd = atk + b_footprints;
    }
    if (card_3rd == "NP" && np_kind == "Q") {
        np_card_buff = q_card_buff + advanced_card_buff_3rd;
        bbonus_3rd = 112;
        card_buff_3rd = q_card_buff + advanced_card_buff_3rd;
        cri_buff_3rd = cri_buff + q_card_cri_buff + advanced_cri_buff_3rd;
    }
    if (card_3rd == "NP" && np_kind == "A") {
        np_card_buff = a_card_buff + advanced_card_buff_3rd;
        bbonus_3rd = 140;
        card_buff_3rd = a_card_buff + advanced_card_buff_3rd;
        cri_buff_3rd = cri_buff + a_card_cri_buff + advanced_cri_buff_3rd;
    }
    if (card_3rd == "NP" && np_kind == "B") {
        np_card_buff = b_card_buff + advanced_card_buff_3rd;
        bbonus_3rd = 210;
        card_buff_3rd = b_card_buff + advanced_card_buff_3rd;
        cri_buff_3rd = cri_buff + b_card_cri_buff + advanced_cri_buff_3rd;
    }
    // 1st共通
    atk_buff_1st = atk_buff + advanced_atk_buff_1st;
    supereffective_buff_1st = supereffective_buff + advanced_supereffective_buff_1st;
    fixed_dmg_1st = fixed_dmg + advanced_fixed_dmg_1st;
    special_def_1st = special_def + advanced_special_def_1st;
    // 2nd共通
    atk_buff_2nd = atk_buff + advanced_atk_buff_2nd;
    supereffective_buff_2nd = supereffective_buff + advanced_supereffective_buff_2nd;
    fixed_dmg_2nd = fixed_dmg + advanced_fixed_dmg_2nd;
    special_def_2nd = special_def + advanced_special_def_2nd;
    // 3rd共通
    atk_buff_3rd = atk_buff + advanced_atk_buff_3rd;
    supereffective_buff_3rd = supereffective_buff + advanced_supereffective_buff_3rd;
    fixed_dmg_3rd = fixed_dmg + advanced_fixed_dmg_3rd;
    special_def_3rd = special_def + advanced_special_def_3rd;
    // EX共通
    atk_buff_ex = atk_buff + advanced_atk_buff_ex;
    supereffective_buff_ex = supereffective_buff + advanced_supereffective_buff_ex;
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
    card_1st = $("#card_1st_" + recNumber).val()
    card_2nd = $("#card_2nd_" + recNumber).val()
    card_3rd = $("#card_3rd_" + recNumber).val()
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
    } else {
        $("#dmg_1st").val(Number($("#dmg_ave_1st_" + recNumber).val().replace(/,/g, "")));
        if (card_1st != "NP") {
            $("#fixed_1st").val(parseFloat($("#fixed_dmg_" + recNumber).val()) + parseFloat($("#advanced_fixed_dmg_1st_" + recNumber).val()) + atk * bchain_bonus / 100);
        } else {
            $("#fixed_1st").val("0");
        }
    };

    if ($("#card_2nd_cri_" + recNumber).val() == "zero") {
        $("#dmg_2nd").val("0");
        $("#fixed_2nd").val("0");
    } else {
        $("#dmg_2nd").val(Number($("#dmg_ave_2nd_" + recNumber).val().replace(/,/g, "")));
        if (card_2nd != "NP") {
            $("#fixed_2nd").val(parseFloat($("#fixed_dmg_" + recNumber).val()) + parseFloat($("#advanced_fixed_dmg_2nd_" + recNumber).val()) + atk * bchain_bonus / 100);
        } else {
            $("#fixed_2nd").val("0");
        }
    };

    if ($("#card_3rd_cri_" + recNumber).val() == "zero") {
        $("#dmg_3rd").val("0");
        $("#fixed_3rd").val("0");
    } else {
        $("#dmg_3rd").val(Number($("#dmg_ave_3rd_" + recNumber).val().replace(/,/g, "")));
        if (card_3rd != "NP") {
            $("#fixed_3rd").val(parseFloat($("#fixed_dmg_" + recNumber).val()) + parseFloat($("#advanced_fixed_dmg_3rd_" + recNumber).val()) + atk * bchain_bonus / 100);
        } else {
            $("#fixed_3rd").val("0");
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

}