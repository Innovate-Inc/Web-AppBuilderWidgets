* Public methods:
  * getCurrentView
  * switchToAppList
  * switchToAppConfig
* Published events:
  * closeAppConfigPage
* Public attributes:
  * appTypes

## About stemapp plugin
For now, stemapp should follow the following rules:
  # Has an index.html page;
  # Has one or more predefined apps, one is called default;
  # Has widgets folder;
  # Has themes folder;
  # Has copy-list.txt file to list all need copy files.
  # Can handle the following events:
    resetConfig,mapChanged,mapOptionsChanged
    themeChanged,styleChanged,layoutChanged
    widgetChanged,widgetPoolChanged,actionTriggered,groupChanged
    appAttributeChanged
  # Publish *appConfigChanged* event after process (5) events
