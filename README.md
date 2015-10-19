Weavver Solar Dashboard
========
License: MIT  
Status: Alpha  
Author: Mitchel Constantin <mythicalbox@weavver.com>  
Company: Weavver, Inc.  
Company Website: www.weavver.com  

The solar dashboard works only with Outback solar equipment right now. Namely the Outback Mate 3.

Pros over Optics RE:
1. Works with older MX60 without a firmware update -- See your solar pv watt curve without taking your system out of service and sending the charge controller in for repair.
2. Designed using bootstrap - looks great on your mobile phone (tested with an iPhone 6S)

I designed this to work with my system:
Outback VFX3648
Outback Mate3
Outback Legacy 10-Hub
Outback MX60 Charge Controller

You will likely have to adjust some of the code to work with your system. With only a few minor code changes this dashboard will work with your system.

I designed this to use Google Charts to plot the historical data which is stored in a MSSQL database.

Create your table as follows:

--------------------------------------------------------------------------------------------
```
USE [weavverdb]
GO

/****** Object:  Table [dbo].[Sensors_Data]    Script Date: 10/13/2015 11:38:01 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[Sensors_Data](
	[Id] [uniqueidentifier] NOT NULL,
	[OrganizationId] [uniqueidentifier] NOT NULL,
	[SensorId] [varchar](75) NOT NULL,
	[Value] [decimal](10, 5) NOT NULL,
	[RecordedAt] [datetime] NOT NULL
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO
```
--------------------------------------------------------------------------------------------
