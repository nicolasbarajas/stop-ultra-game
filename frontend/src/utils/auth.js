export const getClientId = () => {
    let stored = localStorage.getItem("client_id");
    if (!stored) {
        stored = "user_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("client_id", stored);
    }
    return stored;
};

export const getStoredNickname = () => {
    return localStorage.getItem("nickname") || "";
};

export const setStoredNickname = (nick) => {
    localStorage.setItem("nickname", nick);
};
