# Tabs

## Базовый пример:

{% list tabs %}

- Linux

  Контент для Linux.

- macOS

  Контент для macOS.

- Windows

  Контент для Windows.

{% endlist %}

## Синхронизация вкладок по группе:

{% list tabs group=platforms %}

- Linux

  Первый блок: Linux.

- macOS

  Первый блок: macOS.

- Windows

  Первый блок: Windows.

{% endlist %}

{% list tabs group=platforms %}

- Linux

  Второй блок: Linux.

- macOS

  Второй блок: macOS.

- Windows

  Второй блок: Windows.

{% endlist %}

## Варианты отображения:

{% list tabs radio %}

- Tab A

  Радио-вариант: A

- Tab B

  Радио-вариант: B

{% endlist %}

{% list tabs dropdown %}

- One

  Дропдаун-вариант: One

- Two

  Дропдаун-вариант: Two

{% endlist %}

{% list tabs accordion %}

- First

  Аккордеон-вариант: First

- Second

  Аккордеон-вариант: Second

{% endlist %}

## Вложенные табы:

{% list tabs %}

- Outer 1

  Контент внешней вкладки 1.

  {% list tabs %}

  - Inner A

    Контент внутренней A.

  - Inner B

    Контент внутренней B.

  {% endlist %}

- Outer 2

  Контент внешней вкладки 2.

  {% list tabs %}

  - Inner X

    Контент внутренней X.

  - Inner Y

    Контент внутренней Y.

  {% endlist %}

{% endlist %}

## Высота вкладок:

{% list tabs group=height_demo %}

- Короткая

  Короткий блок.

- Высокая

  Высокий блок.

  Абзац 1. Длинный текст для увеличения высоты панели.

  Абзац 2. Длинный текст для увеличения высоты панели.

  Абзац 3. Длинный текст для увеличения высоты панели.

  Абзац 4. Длинный текст для увеличения высоты панели.

  Абзац 5. Длинный текст для увеличения высоты панели.

  Абзац 6. Длинный текст для увеличения высоты панели.

{% endlist %}


