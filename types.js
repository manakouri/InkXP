var GameState;
(function (GameState) {
    GameState[GameState["Home"] = 0] = "Home";
    GameState[GameState["PracticeSetup"] = 1] = "PracticeSetup";
    GameState[GameState["InGame"] = 2] = "InGame";
    GameState[GameState["Results"] = 3] = "Results";
})(GameState || (GameState = {}));

var WritingCategory;
(function (WritingCategory) {
    WritingCategory["Narrative"] = "Narrative";
    WritingCategory["Persuasive"] = "Persuasive";
    WritingCategory["Informative"] = "Informative";
    WritingCategory["Editing"] = "Editing";
})(WritingCategory || (WritingCategory = {}));