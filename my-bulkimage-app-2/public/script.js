// 全局变量保存用户设置
let savedApiKey = '';
let savedModel = 'gpt-4o-mini';
let savedDetail = 'auto';
let savedMaxTokens = 300;

// 处理系统设置按钮的显示与隐藏
document.getElementById('systemSettingsBtn').addEventListener('click', function() {
    const systemSettingsPanel = document.getElementById('systemSettingsPanel');
    systemSettingsPanel.style.display = systemSettingsPanel.style.display === 'block' ? 'none' : 'block';
});

// 保存 API Key 和系统设置
document.getElementById('saveApiKey').addEventListener('click', function() {
    const apiKeyInput = document.getElementById('apiKey');
    savedApiKey = apiKeyInput.value.trim(); // 去除输入的空格

    if (savedApiKey) {
        apiKeyInput.value = ''; // 清空输入框
        apiKeyInput.style.display = 'none'; // 隐藏 API Key 输入框
        document.getElementById('saveApiKey').style.display = 'none'; // 隐藏保存按钮
        document.getElementById('apiKeyStatus').style.display = 'block'; // 显示已保存提示
    } else {
        alert('请输入有效的 API Key');
    }
});

document.getElementById('saveSettings').addEventListener('click', function() {
    savedModel = document.getElementById('modelSelect').value;
    savedDetail = document.getElementById('detailSelect').value;
    savedMaxTokens = parseInt(document.getElementById('maxTokens').value, 10);

    alert('系统设置已保存！');
});

// 提交按钮点击事件
document.getElementById('submitBtn').addEventListener('click', function() {
    const prompt = document.getElementById('prompt').value.trim();
    const files = document.getElementById('files').files;
    const imageUrlsInput = document.getElementById('imageUrls').value.trim();
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = ''; // 清空之前的结果

    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    progressContainer.style.display = 'block'; // 显示进度条
    progressBar.value = 0; // 重置进度条

    let totalTasks = files.length + (imageUrlsInput ? imageUrlsInput.split(' ').length : 0);
    if (totalTasks === 0) {
        alert('请上传文件或提供图片URL');
        return;
    }

    let completedTasks = 0;

    // 更新进度条
    const updateProgress = () => {
        completedTasks++;
        const progressPercentage = (completedTasks / totalTasks) * 100;
        progressBar.value = progressPercentage;

        if (completedTasks === totalTasks) {
            document.getElementById('progressText').textContent = '处理完成！';
        }
    };

    // 处理 API 响应
    const handleApiResponse = (index, type, interpretation) => {
        const resultElement = document.createElement('p');
        resultElement.textContent = `${type} ${index + 1} 结果: ${interpretation}`;
        resultContainer.appendChild(resultElement);
    };

    // 发送 API 请求
    const sendRequest = async (formData, index, type) => {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${savedApiKey}`,
                },
                body: JSON.stringify(formData),
            });

            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status} - ${responseData.error ? responseData.error.message : '未知错误'}`);
            }

            const interpretation = responseData.choices?.[0]?.message?.content || '未返回有效结果';
            handleApiResponse(index, type, interpretation);
        } catch (error) {
            console.error(`请求 ${type} ${index + 1} 出错:`, error.message);
            handleApiResponse(index, type, `错误: ${error.message}`);
        } finally {
            updateProgress(); // 无论请求成功或失败，都更新进度条
        }
    };

    // 处理图片文件
    const processFiles = () => {
        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function () {
                const base64Image = reader.result.split(',')[1];
                const formData = {
                    model: savedModel,
                    max_tokens: savedMaxTokens,
                    messages: [
                        { role: 'user', content: prompt }, // 正确的文本格式
                        { role: 'user', content: { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } } }, // 正确的图片格式
                    ],
                };
                sendRequest(formData, index, '图片');
            };
            reader.readAsDataURL(file);
        });
    };

    // 处理图片 URL
    const processUrls = () => {
        const imageUrls = imageUrlsInput.split(' ');
        imageUrls.forEach((url, index) => {
            const formData = {
                model: savedModel,
                max_tokens: savedMaxTokens,
                messages: [
                    { role: 'user', content: prompt }, // 正确的文本格式
                    { role: 'user', content: { type: 'image_url', image_url: { url: url } } }, // 正确的图片链接格式
                ],
            };
            sendRequest(formData, index, '图片链接');
        });
    };

    // 处理文件上传和 URL 上传
    if (files.length > 0) processFiles();
    if (imageUrlsInput) processUrls();
});

// 一键复制结果
document.getElementById('copyResultsBtn').addEventListener('click', function() {
    const resultsText = document.getElementById('resultContainer').textContent;
    navigator.clipboard.writeText(resultsText)
        .then(() => alert('所有结果已复制！'))
        .catch(err => console.error('复制失败: ', err));
});
