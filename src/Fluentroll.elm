port module Fluentroll exposing (main)

import Array
import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)



-- PORTS AND MAIN


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


port requestTranslate : String -> Cmd msg


port gotTranslation : (Reply -> msg) -> Sub msg



-- INIT


type alias Model =
    { source : String
    , translation : String
    , reply : Reply
    }


init : () -> ( Model, Cmd Msg )
init _ =
    ( Model "" "" initialReply
    , Cmd.none
    )


initialReply : Reply
initialReply =
    { tokens = []
    , changed = []
    }



-- UPDATE


type alias Reply =
    { tokens : List (List String)
    , changed : List (List String)
    }


type Msg
    = NewInput String
    | ClearInput
    | GotTranslation Reply


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NewInput newSource ->
            ( { model | source = newSource }
            , requestTranslate newSource
            )

        ClearInput ->
            ( { model | source = "", translation = "" }
            , Cmd.none
            )

        GotTranslation reply ->
            let
                newTranslation =
                    reply.changed
                        |> List.map (String.join "")
                        |> String.join " "
            in
            ( { model
                | reply = reply, translation = newTranslation }
            , Cmd.none
            )



-- VIEW


view : Model -> Html Msg
view model =
    div []
        [ viewTextBox model
        , viewOutputText model.translation
        , viewTranslationDetails model
        ]


viewTextBox : Model -> Html Msg
viewTextBox model =
    div [ class "field is-grouped" ]
        [ p [ class "control is-expanded" ]
            [ input
                [ type_ "text"
                , class "input"
                , placeholder "Type in your text"
                , value model.source
                , onInput NewInput
                ]
                []
            ]
        , p [ class "control" ]
            [ button
                [ class "button"
                , onClick ClearInput
                ]
                [ text "Clear" ]
            ]
        ]


viewOutputText : String -> Html msg
viewOutputText translation =
    p [ class "subtitle" ] [ text translation ]


viewTranslationDetails : Model -> Html msg
viewTranslationDetails model =
    let
        { reply } =
            model
        
        tokens =
            List.concat reply.tokens
        
        changed =
            List.concat reply.changed

        viewRows =
            zip tokens "" changed
                |> List.map (\(a, b) ->
                    tr
                        []
                        [ td [] [ text a ]
                        , td [] [ text b ]
                        ]
                )
    in
    if String.isEmpty model.translation then
        text ""
    else
        details []
            [ summary [] [ text "Tokens" ]
            , table [ class "table is-narrow" ]
                [ tbody [] viewRows
                ]
            ]



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    gotTranslation GotTranslation



-- UTILITIES


zip : List a -> b -> List b -> List (a, b)
zip xs b ys =
    xs
        |> List.indexedMap (\i ->
            \a ->
                Array.fromList ys
                    |> Array.get i
                    |> Maybe.withDefault b
                    |> Tuple.pair a
        )
