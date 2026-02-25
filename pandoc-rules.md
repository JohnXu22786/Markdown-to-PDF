根据您将\*\*Markdown 转换为 PDF\*\*并设置\*\*字体、页边距、字号及元素样式\*\*的需求，以下是完整参数配置和示例。



\## 一、PDF 生成基础配置



\### 1. 核心参数

```bash

\# 基本转换

pandoc input.md -o output.pdf -s



\# 指定 PDF 引擎（LaTeX 相关）

--pdf-engine=xelatex    # 支持中文等复杂字体（推荐）

--pdf-engine=lualatex   # 更现代的 LaTeX 引擎

--pdf-engine=pdflatex   # 传统引擎

```



\### 2. 文档类设置

```bash

\# 指定文档类

-V documentclass=article     # 文章（默认）

-V documentclass=report      # 报告

-V documentclass=book        # 书籍

-V documentclass=memoir      # 专业排版



\# KOMA-Script 类（更好排版）

-V documentclass=scrartcl    # KOMA 文章

-V documentclass=scrbook     # KOMA 书籍

-V documentclass=scrreprt    # KOMA 报告



\# 文档类选项

-V classoption=twocolumn     # 双栏

-V classoption=oneside       # 单面打印

-V classoption=draft         # 草稿模式

```



\## 二、页面布局与边距



\### 3. geometry 宏包设置

```bash

\# 使用 geometry 宏包控制页边距

-V geometry:margin=1in                    # 所有边距 1 英寸

-V geometry:left=1in,right=1in,top=1in,bottom=1in  # 分别设置

-V geometry:a4paper,margin=2.5cm          # A4 纸 + 边距

-V geometry:letterpaper,left=0.75in       # Letter 纸



\# 更多 geometry 选项

-V geometry:marginparwidth=2cm            # 旁注宽度

-V geometry:headheight=15pt               # 页眉高度

-V geometry:footskip=30pt                 # 页脚偏移

```



\### 4. 纸张大小

```bash

-V papersize=a4            # A4 (默认)

-V papersize=letter        # 美式 Letter

-V papersize=legal         # Legal

-V papersize=executive     # Executive

-V papersize=b5            # B5

```



\## 三、字体与字号设置



\### 5. 字体家族（需 xelatex 或 lualatex）

```bash

\# 主要字体

-V mainfont="Times New Roman"

-V mainfont="Latin Modern Roman"

-V mainfont="TeX Gyre Termes"

-V mainfont="DejaVu Serif"

-V mainfont="Libertinus Serif"



\# 无衬线字体

-V sansfont="Arial"

-V sansfont="Latin Modern Sans"

-V sansfont="TeX Gyre Heros"

-V sansfont="DejaVu Sans"



\# 等宽字体（代码）

-V monofont="Consolas"

-V monofont="Latin Modern Mono"

-V monofont="TeX Gyre Cursor"

-V monofont="DejaVu Sans Mono"



\# 数学字体

-V mathfont="Latin Modern Math"

-V mathfont="TeX Gyre Termes Math"

-V mathfont="XITS Math"



\# 中文字体（中文文档）

-V mainfont="Source Han Serif SC"    # 思源宋体

-V sansfont="Source Han Sans SC"     # 思源黑体

-V monofont="Sarasa Mono SC"         # 等宽字体

-V mathfont="Cambria Math"           # 数学字体

```



\### 6. 字体选项

```bash

\# 字体特性

-V mainfontoptions="Scale=1.1"              # 缩放

-V mainfontoptions="BoldFont=\* Bold"        # 粗体配置

-V mainfontoptions="ItalicFont=\* Italic"    # 斜体配置

-V mainfontoptions="Numbers=OldStyle"       # 老式数字



\# 回退字体

-V mainfontfallback="FreeSans"

-V mainfontfallback="NotoColorEmoji:mode=harf"

```



\### 7. 字号设置

```bash

-V fontsize=10pt      # 小号

-V fontsize=11pt      # 中等

-V fontsize=12pt      # 默认

-V fontsize=14pt      # 大号



\# 使用 setspace 包调整行距

-V linestretch=1.25   # 1.25 倍行距

-V linestretch=1.5    # 1.5 倍行距

```



\## 四、数学公式渲染



\### 8. 数学引擎选择

```bash

\# LaTeX 数学（默认）

无需额外参数，自动处理 $...$ 和 $$...$$ 公式



\# 如需要特定宏包支持

-V mathspec            # 使用 mathspec 而非 unicode-math（仅 xelatex）



\# 启用 cancel 宏包（用于划掉公式）

\# 自动检测 \\cancel, \\bcancel, \\xcancel

```



\## 五、Markdown 元素样式设置



\### 9. 标题样式

```bash

\# 标题编号

-N 或 --number-sections                    # 启用编号

--number-offset=1,4                        # 编号偏移



\# 标题级别重定义

--shift-heading-level-by=-1                # 标题级别偏移

--top-level-division=chapter               # 顶级标题作为"章"



\# 标题间距（需在模板或 header-includes 中设置）

```



\### 10. 列表样式

```bash

\# 列表间距（通过 LaTeX 宏包）

-V itemsep=5pt          # 列表项间距

-V parsep=10pt          # 段落间距

```



\### 11. 代码块样式

```bash

\# 代码高亮主题

--syntax-highlighting=pygments     # 默认

--syntax-highlighting=kate         # Kate

--syntax-highlighting=monochrome   # 单色

--syntax-highlighting=breezeDark   # 暗色主题

--syntax-highlighting=espresso     # 浓缩咖啡主题

--syntax-highlighting=tango        # Tango 主题



\# 自定义高亮样式文件

--syntax-highlighting=mytheme.theme



\# 代码块边框和背景

\# 需通过 header-includes 自定义

```



\### 12. 表格样式

```bash

\# 表格标题位置

--table-caption-position=above    # 标题在表上方（默认）

--table-caption-position=below    # 标题在表下方



\# 表格内边距（通过 booktabs 宏包）

\# 需自定义设置

```



\### 13. 图片样式

```bash

\# 图片标题位置

--figure-caption-position=below   # 标题在图下方（默认）

--figure-caption-position=above   # 标题在图上方



\# 图片大小和位置

\# 在 Markdown 中设置：!\[caption](image.jpg){width=70%}

```



\## 六、颜色与链接



\### 14. 颜色设置

```bash

\# 启用彩色链接

-V colorlinks=true                     # 彩色链接文本

-V colorlinks=false                    # 边框链接（默认）



\# 链接颜色

-V linkcolor=blue                      # 内部链接

-V filecolor=cyan                      # 文件链接

-V citecolor=green                     # 引用链接

-V urlcolor=magenta                    # URL 链接

-V toccolor=red                        # 目录链接

```



\## 七、高级自定义



\### 15. 头部包含自定义 LaTeX

```bash

\# 创建 custom-header.tex 文件，包含：

\\usepackage{setspace}                  % 行距

\\usepackage{titlesec}                  % 标题格式

\\usepackage{fancyhdr}                  % 页眉页脚

\\usepackage{caption}                   % 标题格式

\\usepackage{enumitem}                  % 列表格式

\\usepackage{booktabs}                  % 表格线



\# 然后使用

-H custom-header.tex

```



\### 16. 完整配置示例



创建一个 `config.yaml` 文件：

```yaml

pdf-engine: xelatex

documentclass: article

geometry:

&nbsp; - a4paper

&nbsp; - margin=2.5cm

&nbsp; - headheight=15pt

&nbsp; - footskip=30pt

fontsize: 11pt

linestretch: 1.25

mainfont: "TeX Gyre Termes"

sansfont: "TeX Gyre Heros"

monofont: "TeX Gyre Cursor"

mathfont: "TeX Gyre Termes Math"

mainfontoptions:

&nbsp; - Numbers=OldStyle

&nbsp; - Scale=1.05

colorlinks: true

linkcolor: blue

citecolor: green

urlcolor: cyan

toccolor: red

syntax-highlighting: pygments

number-sections: true

table-of-contents: true

toc-depth: 3

```



使用配置：

```bash

pandoc input.md -o output.pdf --defaults config.yaml

```



\### 17. 常用元素自定义模板代码



创建 `custom-style.tex`：

```latex

% 标题格式

\\titleformat{\\section}{\\normalfont\\Large\\bfseries}{\\thesection}{1em}{}

\\titlespacing\*{\\section}{0pt}{3.5ex plus 1ex minus .2ex}{2.3ex plus .2ex}



% 列表格式

\\usepackage{enumitem}

\\setlist{nosep} % 紧凑列表

\\setlist\[itemize]{leftmargin=\*}

\\setlist\[enumerate]{leftmargin=\*}



% 代码块格式

\\usepackage{framed}

\\usepackage{color}

\\definecolor{shadecolor}{RGB}{248,248,248}



% 表格格式

\\usepackage{booktabs}

\\setlength{\\heavyrulewidth}{1.5pt}

\\setlength{\\lightrulewidth}{0.5pt}

\\renewcommand{\\arraystretch}{1.2}



% 页眉页脚

\\usepackage{fancyhdr}

\\pagestyle{fancy}

\\fancyhf{}

\\fancyhead\[L]{\\leftmark}

\\fancyfoot\[C]{\\thepage}

```



\## 八、综合示例命令



\### 18. 完整命令行示例

```bash

\# 学术论文样式

pandoc paper.md -o paper.pdf \\

&nbsp; --pdf-engine=xelatex \\

&nbsp; -s \\

&nbsp; -V documentclass=article \\

&nbsp; -V geometry:a4paper,margin=2.5cm \\

&nbsp; -V fontsize=11pt \\

&nbsp; -V mainfont="TeX Gyre Termes" \\

&nbsp; -V sansfont="TeX Gyre Heros" \\

&nbsp; -V monofont="Consolas" \\

&nbsp; -V linestretch=1.25 \\

&nbsp; -N \\

&nbsp; --toc \\

&nbsp; --toc-depth=3 \\

&nbsp; --table-of-contents \\

&nbsp; --listings \\

&nbsp; --syntax-highlighting=pygments \\

&nbsp; -H custom-header.tex \\

&nbsp; --filter pandoc-crossref \\

&nbsp; --citeproc \\

&nbsp; --bibliography=references.bib \\

&nbsp; --csl=chicago-author-date.csl

```



\### 19. 中文文档示例

```bash

\# 中文文档配置

pandoc chinese.md -o chinese.pdf \\

&nbsp; --pdf-engine=xelatex \\

&nbsp; -s \\

&nbsp; -V documentclass=ctexart \\

&nbsp; -V geometry:a4paper,margin=2.5cm \\

&nbsp; -V fontsize=12pt \\

&nbsp; -V mainfont="Source Han Serif SC" \\

&nbsp; -V sansfont="Source Han Sans SC" \\

&nbsp; -V monofont="Sarasa Mono SC" \\

&nbsp; -V CJKmainfont="Source Han Serif SC" \\

&nbsp; -V linestretch=1.5 \\

&nbsp; --toc \\

&nbsp; -N

```



\## 九、调试与检查



\### 20. 调试命令

```bash

\# 查看生成的 LaTeX 代码

pandoc input.md -s -o debug.tex



\# 查看默认模板

pandoc -D latex > default.latex



\# 检查支持的字体

fc-list : family   # 查看系统可用字体

```



\*\*建议\*\*：对于复杂文档，建议使用 YAML 配置文件（`--defaults`）管理所有选项，或将常用设置保存为脚本文件。

